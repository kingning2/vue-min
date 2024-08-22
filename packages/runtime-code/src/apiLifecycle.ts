import { currentInstance, setCurrentInstance } from './component'
import { instance } from './type/vnode'

// 生命周期实现
enum lifeCycle {
  BEFOREMOUNT = 'bm',
  MOUNTED = 'm',
  BEFOREUPDATE = 'bu',
  UPDATED = 'u',
}
/**
 * 创建生命周期函数
 * @param lifeCycle 哪个生命周期
 * @returns 实现函数
 */
const createHook = (lifeCycle: lifeCycle): Function => {
  /**
   * 返回函数值
   * @param hook 用户生命周期的方法
   * @param target 当前组件实例
   *
   */
  return (hook: Function, target: instance | null = currentInstance) => {
    injectHooks(lifeCycle, hook, target)
  }
}
/**
 * 创建生命周期函数
 * @param type 哪个生命周期
 * @param hook 用户生命周期的方法
 * @param target 当前组件实例
 */
const injectHooks = (
  type: lifeCycle,
  hook: Function,
  target: instance | null = currentInstance
) => {
  // 如果没有 setup 函数就直接 return 出去
  if (!target) return
  const hooks = target[type] || (target[type] = [])
  const rap = () => {
    setCurrentInstance(target) // 设置生命周期函数
    
    hook() // 执行函数
    setCurrentInstance(null) // 清空生命周期
  }
  hooks.push(rap)
}
// 四个生命周期实现
export const onBeforeMount = createHook(lifeCycle.BEFOREMOUNT)
export const onMounted = createHook(lifeCycle.MOUNTED)
export const onBeforeUpdate = createHook(lifeCycle.BEFOREUPDATE)
export const onUpdated = createHook(lifeCycle.UPDATED)
export const invokeArrayFns = (arr:Function[] | null) => {
  arr.forEach(fn => fn())
}