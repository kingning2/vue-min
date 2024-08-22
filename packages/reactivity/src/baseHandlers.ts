import { hasOwn, isArray, isChanged, isInteger, isObject } from "@vue/shared"
import { reactive, readonly } from "."
import { TiggerTypes, TrackTypes } from "./operations"
import { Track, Trigger } from "./effect"

/** get的方法 */
const get = cretaeGetter()
const shallowGet = cretaeGetter(false, true)
const readonlyGet = cretaeGetter(true)
const shallowReadonlyGet = cretaeGetter(true, true)
/** 处理set的方法 */
const set = cretaeSetter()
const shallowSet = cretaeSetter(true)


/**
 * 处理get方法
 * @param isReadonly 是否为只读的
 * @param isShallow 是否为浅层的
 */
function cretaeGetter(isReadonly = false, isShallow = false) {
  return function get(target, key, receiver) {
    /** 如果是响应式数据的则执行 */
    if (!isReadonly) {
      /** 收集依赖 */
      Track(target,TrackTypes.GET ,key)
    }
    const res = Reflect.get(target, key, receiver)
    /** 如果是浅层的则执行 */
    if (isShallow) {
      return res
    }
    /** 如果是深层的话则执行递归函数 */
    /** 性能优化之一，如果用到了则会代理，不用到就不会代理 */
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }
    return res
  }
}

/** 
 * 处理set方法
 * @param isShallow 是否为浅层的
 */
function cretaeSetter(isShallow = false) {
  return function set(target, key, value, receiver) {
    /** 判断是否为数组的格式 */
    const oldVal = target[key] // 获取老值
    /** 判断是数组还是对象的形式 */
    const hasKey = isArray(target) && isInteger(key) ? Number(key) < target.length : hasOwn(target,key)
    /** 把最新的值设置进去 */
    const res = Reflect.set(target, key, value, receiver)
    /** 判断是新增还是修改状态 */
    if (!hasKey) {
      /** 新增状态 */
      Trigger(target, TiggerTypes.ADD, key, value)
    } else {
      /** 
       * 判断两个值是否有所改变
       * 有变化才走进条件语句中
       */
      if (isChanged(oldVal, value)) {
        /** 修改状态 */
        Trigger(target, TiggerTypes.SET, key, value, oldVal)
      }
    }
    return res
  }
}

export const reactiveHandlers = {
  get,
  set
}
export const shallowReactiveHandlers = {
  get: shallowGet,
  set:shallowSet
}

/** 这两个函数没有进行代理所以不能设置值 */
export const readonlyHandlers = {
  get: readonlyGet,
  set:(target, key, value) => {
    console.log(`set on key is falid`);
  }
}
export const shallowReadonlyHandlers = {
  get: shallowReadonlyGet,
  set:(target, key, value) => {
    console.log(`set on key is falid`);
  }
}