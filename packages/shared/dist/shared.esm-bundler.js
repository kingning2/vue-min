const isObject = (target) => {
    return typeof target === 'object' && target !== null;
};
const isArray = Array.isArray;
const isFunction = (val) => typeof val === 'function';
const isString = (val) => typeof val === 'string';
const isNumber = (val) => typeof val === 'number';
const isBoolean = (val) => typeof val === 'boolean';
const isSymbol = (val) => typeof val === 'symbol';
const isUndefined = (val) => typeof val === 'undefined';
const isNull = (val) => val === null;
/** 对象是否具有指定的属性 */
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
/** 判断是否为整数 */
const isInteger = (val) => parseInt(val) + '' === val;
/** 判断是否有所变化 */
const isChanged = (oldVal, newVal) => String(oldVal) !== String(newVal);
/** 判断是否为事件 */
const onRE = /^on[^a-z]/;
const isOn = (key) => onRE.test(key);
/** 对象合并的方法 */
const extend = Object.assign;
/** 判断类型是否相同 */
const isSomeVode = (oldvalue, newVnode) => {
    return oldvalue.type === newVnode.type && oldvalue.key === newVnode.key;
};

export { extend, hasOwn, isArray, isBoolean, isChanged, isFunction, isInteger, isNull, isNumber, isObject, isOn, isSomeVode, isString, isSymbol, isUndefined };
//# sourceMappingURL=shared.esm-bundler.js.map
