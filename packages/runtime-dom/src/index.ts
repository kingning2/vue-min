/** 出口文件 */

import { extend } from '@vue/shared'
import { patchProp } from './patchProp'
import { nodeOps } from './nodeOps'
import { createRender } from '@vue/runtime-code'

/** 合并操作 */
const renderOptionsDom = extend({ patchProp }, nodeOps)

/**
 * 导出创建app的实例
 * @param rootComponent 组件
 * @param rootProps 属性
 * @param slots 插槽
 * @returns
 */
export const createApp = (rootComponent, rootProps,slots?) => {
  const app: any = createRender(renderOptionsDom).createApp(rootComponent, rootProps,slots)
  const { mount } = app
  /**
   * 挂载组件
   * @param container 挂载到#app
   * @returns
   */
  app.mount = (container: any) => {
    /** 清空原先的内容 */
    container = renderOptionsDom.querySelector(container)
    container.innerHTML = ''
    mount(container)
  }
  return app
}
export * from '@vue/runtime-code'