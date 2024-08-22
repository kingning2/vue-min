import { isOn } from '@vue/shared'
import { patchAttr } from '../modules/attr'
import { patchClass } from '../modules/class'
import { patchStyle } from '../modules/style'
import { patchEvent } from '../modules/event'

/**
 * 操作节点
 * @param el 要操作的节点
 * @param key 添加的属性类型 例如 class
 * @param prevValue 上一次的值
 * @param nextValue 这一次的值
 */
export const patchProp = (
  el: Element,
  key: string,
  prevValue: any,
  nextValue: any
) => {
  switch (key) {
    case 'class':
      patchClass(el, nextValue)
      break
    case 'style':
      patchStyle(el, prevValue, nextValue)
      break
    default:
      /** 判断是不是事件 */
      if (isOn(key)) {
        patchEvent(el, key, nextValue)
      } else {
        patchAttr(el, key, nextValue)
      }
      break
  }
}
