import { vnode } from 'packages/runtime-code/src/type/vnode';

export const isObject = (target) => {
  return typeof target === 'object' && target !== null;
}
export const isArray = Array.isArray;
export const isFunction = (val) => typeof val === 'function';
export const isString = (val) => typeof val === 'string';
export const isNumber = (val) => typeof val === 'number';
export const isBoolean = (val) => typeof val === 'boolean';
export const isSymbol = (val) => typeof val === 'symbol';
export const isUndefined = (val) => typeof val === 'undefined';
export const isNull = (val) => val === null;

/** 对象是否具有指定的属性 */
const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (
  val: object,
  key: string | symbol
): key is keyof typeof val => hasOwnProperty.call(val, key)

/** 判断是否为整数 */
export const isInteger = (val) => parseInt(val) + '' === val;

/** 判断是否有所变化 */
export const isChanged = (oldVal, newVal) => String(oldVal) !== String(newVal);

/** 判断是否为事件 */
const onRE = /^on[^a-z]/
export const isOn = (key: string) => onRE.test(key)

/** 对象合并的方法 */
export const extend = Object.assign

/** 判断类型是否相同 */
export const isSomeVode = (oldvalue:vnode, newVnode:vnode) => {
  return oldvalue.type === newVnode.type && oldvalue.key === newVnode.key
}

/** 判读是否为组件 */
export * from './shapeFlag'