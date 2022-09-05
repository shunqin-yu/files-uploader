import utils from './utils'

var event = {
	_eventData: null,

	/**
	 * 监听事件
	 * @param {String} name 事件名
	 * @param {Function} func 触发函数
	 */
	on: function (name, func) {
		// 没有注册过事件
		if (!this._eventData) this._eventData = {}

		// 没有注册过该事件
		if (!this._eventData[name]) this._eventData[name] = []

		var listened = false

		// 查找该触发函数是否已存在
		utils.each(this._eventData[name], function (fuc) {
			if (fuc === func) {
				listened = true
				return false
			}
		})

		// 如不存在 则在下方push进事件函数队列
		if (!listened) {
			this._eventData[name].push(func)
		}
	},

	/**
	 * 移除监听事件
	 * @param {String} name 事件名
	 * @param {Function} func 触发函数
	 * @returns {void}
	 */
	off: function (name, func) {
		if (!this._eventData) this._eventData = {}
		if (!this._eventData[name] || !this._eventData[name].length) return
		if (func) {
			utils.each(
				this._eventData[name],
				function (fuc, i) {
					if (fuc === func) {
						this._eventData[name].splice(i, 1)
						return false
					}
				},
				this,
			)
		} else {
			this._eventData[name] = []
		}
	},

	/**
	 * 触发监听事件
	 * @param {String} name 事件名
	 * @returns {Boolean}
	 */
	trigger: function (name) {
		// 没有注册过事件
		if (!this._eventData) this._eventData = {}

		// 没有注册该事件
		if (!this._eventData[name]) return true

		// 除了事件名以外的所有参数
		var args = this._eventData[name].slice.call(arguments, 1)
    
		var preventDefault = false

		// 循环该事件的所有触发函数
		utils.each(
			this._eventData[name],
			function (fuc) {
				preventDefault = fuc.apply(this, args) === false || preventDefault
			},
			this,
		)

		// 如果存在返回值为false的函数，则return false
		return !preventDefault
	},
}

export default event
