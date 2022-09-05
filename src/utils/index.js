export { default as Log } from './log'

export const createUid = () => Math.random().toString(36)

export const pick = (obj, keys) => {
	const newObj = { ...obj }
	if (!keys) return newObj

	if (!Array.isArray(keys)) keys = [keys]

	Object.keys(newObj).reduce((object, key) => {
		if (keys.includes(key)) object[key] = newObj[key]

		return object
	}, {})
}
