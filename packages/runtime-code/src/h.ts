import { isArray, isObject } from '@vue/shared'
import { createVnode, isVnode } from './vnode'

/**
 * 创建真实节点的函数
 * @param type 在哪个位置上放置
 * @param propsOrchildren 接收的样式或者属性
 * @param children 子节点，也可以是嵌套另一个 h 函数
 * @returns 执行 createVnode 函数
 */
export function h(type: string, propsOrchildren?: any, children?: any) {
  // 判断传递多少个参数
  const i = arguments.length
  /** 只有两个参数的时候 */
  /** type + propsOrchildren  或者 type + children */
  
  if (i === 2) {
    /** type + propsOrchildren 的情况 */
    // 判断是否为对象以及是不是数组格式
    if (isObject(propsOrchildren) && !isArray(propsOrchildren)) {
      /** 判断是不是vnode节点 */
      if (isVnode(propsOrchildren)) {
        return createVnode(type, null, [propsOrchildren])
      }
      return createVnode(type, propsOrchildren)
    } else {
      /** type + children 的情况 */
      return createVnode(type, null, propsOrchildren)
    }
  } else {
    if ( i > 3 ) {
      /** 如果大于三的话就把第二个后面的数全部添加到子类上 */
      children = Array.prototype.slice.call(arguments, 2)
    } else {
      children = [children]
    }
    /** 直接创建虚拟 dom */
    return createVnode(type, propsOrchildren, children)
  }
}
