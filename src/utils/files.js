import { createUid } from './index'
import Log from './log'

const fileToObject = (file, params) => {
	const { parentId } = params

	file.parentId || (file.parentId = parentId)

	return Object.assign({}, file, {
		...params,
		name: file.name,
		size: file.size,
		type: file.type,
		originFileObj: file,
	})
}

export const formatFiles = files => {
	// 个人盘根目录id
	const parentId = -1

	return Array.from(files).map(el => {
		const id = el.id || createUid()
		const path = el.filePath || '个人空间'

		const fileObj = fileToObject(el, {
			id,
			path,
			parentId,
			diskType: 1,
		})

		Log.info('[formatFiles] fileObj:', fileObj)

		return fileObj
	})
}

export const getUploadType = file => (file.chunks.length > 1 ? 3 : 1)
