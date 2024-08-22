export type vnode = {
  _v_isVnode: boolean, // 是否为虚拟节点
  type: any, // 哪一个节点
  props: object, // 参数
  slots: any, // 子类
  key: props // 组件实例
  shapeFlag: number,
  component: {},
  el: any,
}

export type instance = {
  newVnode: vnode, // 组件
  props: object, // 组件属性
  attrs: object, // 获取组件所有属性
  setupState: object, // setup 返回值
  ctx: object, // 代理
  proxy: object, // 通过这个来进行代理
  isMounted: boolean, // 是否挂载过了
  type: any, // 组件类型
  render: any, // 渲染函数
  slots: object, // 插槽
  subTree: vnode, // vnode的返回值
  bm:Array, // 生命周期 onBeforeMount 函数
  m:Array, // 生命周期 onMounted 函数
  bu:Array, // 生命周期 onBeforeUpdate 函数
  u:Array, // 生命周期 onUpdated 函数
}