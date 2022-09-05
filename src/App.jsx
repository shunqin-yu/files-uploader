import UploaderDom from './UploaderDom'
import { formatFiles } from './utils/files'
import Upload from './utils/upload'

function App() {
	const startUploadFileOrDir = e => {
		const files = e.target.files

		Upload.start(formatFiles(files))

		e.target.value = ''
	}

	return (
		<div className="App">
			<UploaderDom startUpload={startUploadFileOrDir} />
		</div>
	)
}

export default App
