import { isArray, isInteger } from '@vue/shared'
import { TiggerTypes } from './operations'

export function effect (fn: Function, options: any = {}) {
  /** 创建一个执行函数 */
  const effect = createReactEffect(fn, options)
  
  /** 如果传递一个lazy为true则不执行直接返回 */
  if (!options.lazy) {
    effect() // 默认执行
  }
  return effect
}

// 定义一个id来区别不同的响应式数据
let uid = 0
let effectStack = []
let activeEffect = null // 保存当前的effect
function createReactEffect(fn: Function, options: any = {}) {
  /** 执行用户的操作 */
  const effect = function reactiveEffect() {
    try {
      /** 把数据存储进去 */
      
      effectStack.push(effect)
      activeEffect = effect
      return fn()
    } finally {
      /** 删除数组的最后一个 */ 
      effectStack.pop()
      /** 获取数组的最后一个赋值给 activeEffect */
      activeEffect = effectStack[effectStack.length - 1]
    }
  }
  effect.id = uid++ // 区别不同的effect
  effect._isEffect = true // 是不是响应式的
  effect.row = fn // 用户的执行操作
  effect.options = options // 保存用户传过来的属性
  
  return effect
}

let targetMap = new WeakMap() // 全局对象
/**
 * 获取视图的时候就执行的操作
 * @param target 要收集的对象
 * @param type 类型
 * @param key 属性
 */
export const Track = (target: object, type, key: string) => {
  /** 如果没有在 effect 函数中获取值则直接跳出循环 */
  if (!activeEffect) return
  /** 获取一下这个对象是否有包含target这个属性 */
  let depMap = targetMap.get(target)
  if (!depMap) {
    /** 没有就给这个属性赋值 */
    targetMap.set(target, (depMap = new Map()))
  }
  /** 获取target里面是否有key这个属性 */
  let deps = depMap.get(key)

  if (!deps) {
    /** 没有就给这个属性赋一个数组 */
    depMap.set(key, (deps = new Set()))
  }
  /** 判断deps中有没有 key */
  if (!deps.has(activeEffect)) {
    /** 把effect添加到deps中 */
    deps.add(activeEffect)
  }
}
/**
 * 修改视图的时候就执行的操作
 * @param target 要收集的对象
 * @param type 类型
 * @param key 属性
 * @param newVal 新值
 * @param oldVal 旧值
 */
export const Trigger = (target: object, type, key: string, newVal?: any, oldVal?: any) => {
  /** 判断属性里面是否有代理的对象 */
  const depsMap = targetMap.get(target)
  /** 如果没有在视图上运用的话就不会代理 */
  if (!depsMap) return
  let deps = new Set()
  /** 判断属性里面是否有方法 */
  const effects = depsMap.get(key)
  /** 有的话就把所有的方法映射在deps数组中 */
  const add = (effects) => {
    if (effects) {
      /** 对象形式 */
      effects.forEach((effect) => deps.add(effect))
    }
  }
  if (key === 'length' && isArray(target)) {
    /** 数组形式 */
    /** 在处理数组的时候，key === length */
    depsMap.forEach((depVal, key) => {
      if (key === 'length' || key > newVal) {
        add(depVal)
      }
    })
  } else {
    /** 可能是对象 */
    if (key !== undefined) {
      add(effects)
    }
    switch (type) {
      case TiggerTypes.ADD:
        if (isArray(target) && isInteger(key)) {
          add(depsMap.get('length'))
        }
    }
  }
  /**
   * 批量执行数组
   * ! ts类型检查只要加any就能执行函数
   * ? Set数组类型是为了让重复值进行去重
   */
  deps.forEach((eff: any) => {
    
    if (eff.options.run) {
      eff.options.run()
    } else {
      eff()
    }
  })
}
