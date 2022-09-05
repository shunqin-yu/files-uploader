import Events from './events'
import Uploader from './../uploader'
import { getUploadType } from './files'
import { pick } from './index'
import Service from '@/services'
import { Log } from '@/utils'

class Upload {
	uploader

	defaults = Upload.defaults

	works = new Map()

	filesParams = new Map()

	bindUploadEvent() {
		;['fileAdded', 'fileSuccess', 'fileError', 'fileProgress'].forEach(m => {
			const methodName = 'on' + m.substring(0, 1).toLocaleUpperCase() + m.substring(1)

			this.uploader.on(m, this[methodName])
		})
	}

	emit(eventName, file, params) {
		console.log('Upload[emit],eventName: %s', eventName)
		Events.emit(eventName, {
      id: file.id,
			...params,
    })
	}

	onFileAdded(file) {
		Log.info('[onFileAdded] this:', this)
		const work = new Worker('./../worker/computeMD5.js')
		this.works.set(file.id, work)

		const onSuccess = md5 => {
			file.uniqueIdentifier = md5
			this.preUpload(file)
			work.close()
		}

		const onError = () => {}

		const messageEventsFunc = {
			onSuccess,
			onError,
		}

		work.onmessage = e => {
			const { data, code } = e

			messageEventsFunc[code](data)
		}

		work.postMessage({
			file,
			code: 'start',
			chunkSize: this.defaults.chunkSize
		})
	}

  onFileProgress(rootFile, file) {
    this.emit('progress', file, {
      size: file.size,
      speed: file.averageSpeed,
      progress: file.progress(),
      uploaded: Math.floor(100 * rootFile.progress()) + '% ',
    })
  }

  onFileSuccess(_, file, res) {
    // 文件size小于分片大小，则直接完成
    if (file.size < this.defaults.chunkSize) {
      this.emit('success', file)
      return
    } 

    // 合并分片
    this.mergeChunks(file)
  }

  onFileError(_, file, message) {
    this.emit('error', file, {
      message: message || '网络异常'
    })
  }

  async mergeChunks(file) {
    const fileParams = this.filesParams.get(file.id)
    const fileRealPath = fileParams?.fileRealPath

    const {
      uniqueIdentifier,
      pre: { uploadId, dfsFileId, parentId } = {},
      chunks,
    } = file

    this.emit('merging', file)
  
    const params = {
      comeFrom: 10,
      parentId,
      fileRealPath,
      fileMd5: uniqueIdentifier,
      uploadId,
      dfsFileId,
      partCount: chunks.length,
      ...this.getFileInfos(file)
    }

    try {
      const res = await Service(Upload.URLS.merge, params)

      const { code, summary, var: _var } = JSON.parse(res)
  
        if (['S_OK', 'DFS_118'].includes(code)) {
          this.emit('success', file, {
            isQuick: code === 'DFS_118',
          })
  
          return
        }
  
        this.emit('error', file, { message: summary })

    } catch (error) {
      this.emit('error', file, {  message: '网络异常' })
    }
  }

	start(data) {
		Log.info('[Upload.start] data:', data)
		const { params, fileId } = data
		this.filesParams.set(fileId, params)

		if (!this.uploader) {
			this.create()
		}

		this.uploader.addFiles(data)
	}

	create() {
		const opts = {
			...this.defaults,
			target: Upload.URLS.upload,
			processParams: this.processParams,
			processResponse: this.processResponse,
		}

		this.uploader = new Uploader(opts)

		this.bindUploadEvent()
	}

	processParams(params, file, chunk) {
		const { identifier } = params
		const {
			file: { type } = {},
			pre: {
				uploadId,
				dfsFileId,
				bucketName = '',
				objectKey = '',
				cloudpMultipartFileId = '',
				parentId,
			} = {},
			chunks,
		} = file
		const { startByte, endByte, offset } = chunk
		const fileParams = this.filesParams.get(file.id)

		// 非秒传并且是上传文件夹的场景，需要拿到上传的文件夹的 id
		if (fileParams?.fileRealPath) {
			fileParams.parentId = parentId
			this.filesParams.set(file.id, { ...fileParams, parentId })
		}

		return {
			// params中取到的值
			fileMd5: identifier,
			// file中取到的值
			uploadId,
			dfsFileId,
			bucketName,
			objectKey,
			cloudpMultipartFileId,
			type,
			// chunk取到的值
			start: startByte,
			range: `${startByte}-${endByte - 1}`,
			partNum: offset + 1,
			partCount: chunks.length,
			...this.getFileInfos(file), // file.file?
		}
	}

	processResponse(res, cb) {
		try {
			const { code, summary } = JSON.parse(res)
			const successful = ['S_OK', 'DFS_118'].includes(code)

			cb(successful ? null : summary, res)
		} catch (e) {
			cb(res.summary || '内部错误', res)
		}
	}

	// 获取文件的name，size，uploadType以及参数
	getFileInfos(file) {
		const fileParams = this.filesParams.get(file.id)

		return {
			...fileParams,
			fileName: encodeURIComponent(file.name),
			fileSize: file.size,
			uploadType: getUploadType(file),
		}
	}

	async preUpload(file, shouldRetry) {
		const fileParams = this.filesParams.get(file.id)

		const fileRealPath = fileParams?.fileRealPath

		const params = {
			appFileId: '',
			model: 0,
			newFlag: 1,
			...fileParams,
			fileRealPath: fileRealPath,
			fileMd5: file.uniqueIdentifier,
			...this.getFileInfos(file),
		}

    try {
			const { status, res } = await Service(upload.URLS.pre, params)

			const { code, var: _var, summary } = JSON.parse(res)

			// 秒传
			if (code === 'DFS_118') {
				Events.on('success', {
					id: file.id,
					isQuick: true,
				})
			} else if (code === 'S_OK') {
				file.pre = pick(_var, [
					'uploadId',
					'dfsFileId',
					'parentId',
					'partNum',
					'isLocalZone',
					'fastUploadUrl',
					'token',
					'bucketName',
					'objectKey',
					'cloudpMultipartFileId',
				])

				if (shouldRetry) {
					file.aborted = false
					file.retry()
				} else {
					this.uploader.upload()
				}
			} else {
				const message =
					{
						504: '网关超时',
						500: '服务器错误',
					}[status] || summary

				this.emit('error', file, {
					message,
				})
			}
		} catch (error) {
			this.emit('error', file, { message: '网络异常' })
		}
	}
}

Upload.URLS = {
	pre: '/drive/service/common/file.do?func=common:upload',
	upload: '/drive/service/common/onestfile.do?func=common:onestUpload',
	merge: '/drive/service/common/file.do?func=common:completeUpload',
}

Upload.defaults = {
	forceChunkSize: true,
	allowDuplicateUploads: true,
	simultaneousUploads: 1,
	chunkSize: 5 * 1024 * 1024,
	chunkRetryInterval: 500,
	progressCallbvaracksInterval: 500,
	maxChunkRetries: 5,
	speedSmoothingFactor: 0.1,
	fileParameterName: 'file',
	testChunks: false,
	withCredentials: true,
	uploadMethod: 'POST',
	initialPaused: true,
}

export default new Upload