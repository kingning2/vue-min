import { hasOwn } from '@vue/shared'

export const componentPublicIntance: any = {
  /** 解构出_这个属性 */
  get({ _: instance }, key) {
    // 获取值的时候触发的函数
    /** 解构 props 以及 setupState  */
    const { props, setupState } = instance
    
    /** 如果有的话就把这个返回出去 */
    if (hasOwn(props, key)) {
      return props[key]
    } else if (hasOwn(setupState, key)) {
      return setupState[key]
    }
  },
  set({ _: instance }, key, value) {
    // 获取值的时候触发的函数
    /** 解构 props 以及 setupState  */
    const { props, setupState } = instance
    /** 如果有的话就把这个返回出去 */
    if (hasOwn(props, key)) {
      props[key] = value
    } else if (hasOwn(setupState, key)) {
      setupState[key] = value
    }
  },
}
