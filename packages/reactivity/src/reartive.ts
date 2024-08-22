import { isObject } from '@vue/shared'
import {
  reactiveHandlers,
  shallowReactiveHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from './baseHandlers'

const reactiveMap = new WeakMap()
const readonlyMap = new WeakMap()
/**
 * 创建函数的核心代码
 * @param target 目标对象
 * @param isReadonly 是否为只读的
 * @param baseHandlers 公共形参
 */
function createReactObj(target, isReadonly, baseHandlers) {
  /** 监听这个对象是不是一个对象 */
  if (!isObject(target)) return target
  /** 判断是否代理过了 */
  const proxyMap = isReadonly ? readonlyMap : reactiveMap
  const proxyEs = proxyMap.get(target)
  if (proxyEs) return proxyEs
  /** 没代理过就帮忙监听 */
  const proxy = new Proxy(target, baseHandlers)
  proxyMap.set(target, proxy)
  return proxy
}


/**
 * 输出四个函数
 * 区别
 * 1、是否为只读
 * 2、是否为深层监视
 */

/** 深层监视并且可修改的 */
export function reactive(target) {
  return createReactObj(target, false, reactiveHandlers)
}

/** 浅层监视并且课修改的 */
export function shallowReactive(target) {
  return createReactObj(target, false, shallowReactiveHandlers)
}

/** 深层监视并且只读的 */
export function readonly(target) {
  return createReactObj(target, true, readonlyHandlers)
}

/** 浅层监视并且只读的 */
export function shallowReadonly(target) {
  return createReactObj(target, true, shallowReadonlyHandlers)
}

/** 使用 reactive 代理 */
export const convert = (val) => {
  /** 判断是不是对象的形式 */
  return isObject(val) ? reactive(val) : val
}