import { ShapeFlags, isArray, isObject, isString } from '@vue/shared'
import { vnode } from './type/vnode'

/**
 * 创建虚拟节点
 * @param type 组件上的方法
 * @param props 组件上的属性
 * @param slots 子类
 * @returns vnode 实例对象
 */
export const createVnode = (type, props, slots: any = null) => {
  // 判断是组件还是文本
  let shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0
  const vnode:vnode = {
    _v_isVnode: true, // 是否为虚拟节点
    type, // 传递过来的所有函数
    props, // 参数
    slots, // 子类
    key: props && props.key, // 用于deff算法的key
    shapeFlag,
    el:null,
    component: {}
  }
  /** 儿子标识，判断是否有插槽的存在  数组为存在，文本为不存在 */
  normalizeChildren(vnode, slots)
  return vnode
}

function normalizeChildren(vnode: vnode, slots: Object) {
  let type = 0
  if (!slots) {
  } else if (isArray(slots)) {
    type = ShapeFlags.ARRAY_CHILDREN // 数组格式
  } else {
    type = ShapeFlags.TEXT_CHILDREN // 文本格式
  }
  /** 与组件进行比对 */
  vnode.shapeFlag = vnode.shapeFlag | type
}

/**
 * 判断是否为 vnode
 * @param vnode 进行比对的元素
 * @returns 
 */
export const isVnode = (vnode) => {
  return vnode._v_isVnode
}

/**
 * 生成子类虚拟dom
 */
export const TEXT = Symbol('text')
export const CVnode = (child: any) => {
  if (isObject(child)) return child
  return createVnode(TEXT, null, String(child))
}