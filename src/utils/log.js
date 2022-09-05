class Log {
	console = window.console

	log(color, arg) {
		return restArgs =>
			this.console.log.bind(null, '%c ' + arg, `color:${color}`).apply(this.console, restArgs)
	}

	info(arg, ...rest) {
		this.log('gray', arg)(rest)
	}

	warn(arg, ...rest) {
		this.log('brown', arg)(rest)
	}

	success(arg, ...rest) {
		this.log('green', arg)(rest)
	}

	error(arg, ...rest) {
		this.log('red', arg)(rest)
	}
}

export default new Log()
