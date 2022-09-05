self.importScripts('./spark-md5.min.js')

self.addEventListener('message', messageHandler, true)

const messageHandler = e => {
	const data = e.data
	const code = data.code

	switch (code) {
		case 'start':
			start(data)
			break
	}
}

const sendPostMsg = (code, data) => {
	console.log('computeMD5[sendPostMsg], code:%s', code, data)
	self.postMessage({ code, ...data })
}

const getBlobSlice = () => {
	const bproto = window.Blob.prototype

	const blobSliceName = ['slice', 'mozSlice', 'webkitSlice'].find(k => !!bproto[k])

	return bproto[blobSliceName]
}

const sparkMD5 = new SparkMD5.ArrayBuffer()

const fileReader = new FileReader()

let currentChunk = 0,

const resolve = () => {
	const fileMd5 = spark.end()

  sendPostMsg('onSuccess', fileMd5)
}

const start = ({ file, chunkSize }) => {
	const { size } = file

	const chunks = Math.ceil(size / chunkSize)

	const blobSlice = getBlobSlice()

	const getRange = () => {
		const start = currentChunk * chunkSize
		const nextSize = start + chunkSize
		const end = nextSize >= size ? size : nextSize

		return {
			start,
			end,
		}
	}

	const loadNext = () => {
		const { start, end } = getRange()
		fileReader.readAsArrayBuffer(blobSlice.call(file.file, start, end))
	}

	fileReader.onload = e => {
		spark.append(e.target.result)
		currentChunk++
    currentChunk < chunks ? loadNext() : resolve()
	}

	fileReader.onerror = () => {
    sendPostMsg('onError')
		file.cancel()
	}
}
