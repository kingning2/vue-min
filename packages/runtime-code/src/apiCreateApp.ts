import { createVnode } from "./vnode"

/**
 * 创建app
 * @param rootComponent 组件
 * @param rootProps 属性
 * @param children 插槽
 * @returns
 */
export const ApiCreateApp = (render) => {
  /**
   * @param rootComponent 组件上面的方法 如：setup
   * @param rootProps 组件上面的属性 如：props
   * @param slots 插槽
   * @returns
   */
  return function createApp(rootComponent, rootProps,slots?) {
    /** 创建app实例 */
    const app = {
      _component: rootComponent, // 组件
      _props: rootProps, // 属性
      _container: null, // 之前是否存在
      mount(container: string) {
        /** 创建虚拟dom */
        let vnode = createVnode(rootComponent, rootProps,slots) // 创建虚拟节点
        render(vnode, container) // 函数第一次就调用这个接口
      },
    }
    return app
  }
}
