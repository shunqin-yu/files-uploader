var oproto = Object.prototype
var aproto = Array.prototype
var serialize = oproto.toString

var isFunction = function (fn) {
  return serialize.call(fn) === '[object Function]'
}

var isArray = Array.isArray || /* istanbul ignore next */ function (ary) {
  return serialize.call(ary) === '[object Array]'
}

// 检查对象是否存在原型方法
var isPlainObject = function (obj) {
  return serialize.call(obj) === '[object Object]' && Object.getPrototypeOf(obj) === oproto
}

var i = 0
var utils = {
  uid: function () {
    return ++i
  },
  noop: function () {},
  bind: function (fn, context) {
    return function () {
      return fn.apply(context, arguments)
    }
  },
  preventEvent: function (evt) {
    evt.preventDefault()
  },
  stop: function (evt) {
    evt.preventDefault()
    evt.stopPropagation()
  },
  nextTick: function (fn, context) {
    setTimeout(utils.bind(fn, context), 0)
  },
  /**
   * 将类数组转换为数组
   * @param {Object} ary 
   * @param {Number|Undefined} start 默认为0
   * @param {Number|Undefined} end 默认为数组的长度
   * @returns {Array} 
   */
  toArray: function (ary, start, end) {
    if (start === undefined) start = 0
    if (end === undefined) end = ary.length
    return aproto.slice.call(ary, start, end)
  },

  isPlainObject: isPlainObject,
  isFunction: isFunction,
  isArray: isArray,
  isObject: function (obj) {
    return Object(obj) === obj
  },
  isString: function (s) {
    return typeof s === 'string'
  },
  isUndefined: function (a) {
    return typeof a === 'undefined'
  },
  isDefined: function (a) {
    return typeof a !== 'undefined'
  },

  // 遍历，如果回调返回结果为false则结束遍历
  each: function (ary, func, context) {
    if (utils.isDefined(ary.length)) {
      for (var i = 0, len = ary.length; i < len; i++) {
        if (func.call(context, ary[i], i, ary) === false) {
          break
        }
      }
    } else {
      for (var k in ary) {
        if (func.call(context, ary[k], k, ary) === false) {
          break
        }
      }
    }
  },

  /**
   * 如果data为函数，则执行该函数，并透传其余参数
   * 否则返回data
   */
  evalOpts: function (data, args) {
    
    if (utils.isFunction(data)) {
      // `arguments`是类数组，所以需要转换为数组
      args = utils.toArray(arguments)
      data = data.apply(null, args.slice(1))
    }
    return data
  },

  extend: function () {
    var options
    var name
    var src
    var copy
    var copyIsArray
    var clone
    var target = arguments[0] || {}
    var i = 1
    var length = arguments.length
    var force = false

    // 如果第一个参数为布尔,判定是否深拷贝
    if (typeof target === 'boolean') {
      force = target
      target = arguments[1] || {}
      i++
    }

    // 确保接受方为一个复杂的数据类型
    if (typeof target !== 'object' && !isFunction(target)) {
      target = {}
    }

    // 如果只有一个参数，那么新成员添加于 extend 所在的对象上
    if (i === length) {
      target = this
      i--
    }

    for (; i < length; i++) {
      // 只处理非空参数
      if ((options = arguments[i]) != null) {
        for (name in options) {
          src = target[name]
          copy = options[name]

          // 防止环引用
          if (target === copy) {
            continue
          }
          if (force && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
            if (copyIsArray) {
              copyIsArray = false
              clone = src && isArray(src) ? src : []
            } else {
              clone = src && isPlainObject(src) ? src : {}
            }
            target[name] = utils.extend(force, clone, copy)
          } else if (copy !== undefined) {
            target[name] = copy
          }
        }
      }
    }
    return target
  },

  // 格式化文件大小
  formatSize: function (size) {
    if (size < 1024) {
      return size.toFixed(0) + ' bytes'
    } else if (size < 1024 * 1024) {
      return (size / 1024.0).toFixed(0) + ' KB'
    } else if (size < 1024 * 1024 * 1024) {
      return (size / 1024.0 / 1024.0).toFixed(1) + ' MB'
    } else {
      return (size / 1024.0 / 1024.0 / 1024.0).toFixed(1) + ' GB'
    }
  },

  // 定义不可枚举属性
  defineNonEnumerable: function (target, key, value) {
    Object.defineProperty(target, key, {
      enumerable: false,
      configurable: true,
      writable: true,
      value: value
    })
  }
}

export default utils
