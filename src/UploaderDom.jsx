import { Fragment, useEffect, useMemo, useRef } from 'react'

const UploaderDom = ({ startUpload }) => {
	const fileUploader = useRef(null)
	const dirUploader = useRef(null)
	const fileUploaderNormalProps = useMemo(
		() => ({
			multiple: true,
			type: 'file',
			style: { display: 'none' },
		}),
		[],
	)

	const handleClickFile = () => {
		fileUploader.current.click()
	}

	const handleClickDir = () => {
		dirUploader.current.click()
	}

	useEffect(() => {
		fileUploader.current.addEventListener('change', startUpload)
		dirUploader.current.addEventListener('change', startUpload)

		return () => {
			fileUploader.current.addEventListener('change', startUpload)
			dirUploader.current.addEventListener('change', startUpload)
		}
	}, [])

	return (
		<Fragment>
			<input {...fileUploaderNormalProps} id="file-uploader" ref={fileUploader} />
			<input
				{...fileUploaderNormalProps}
				webkitdirectory="true"
				id="dir-uploader"
				ref={dirUploader}
			/>
			<button onClick={handleClickFile}>上传文件</button>
			<button onClick={handleClickDir}>上传文件夹</button>
		</Fragment>
	)
}

export default UploaderDom
