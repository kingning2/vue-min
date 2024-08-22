/**
 * 设置自定义属性的方法
 * @param el 想要设置的元素
 * @param key 自定义的属性名
 * @param value 获取到的新值
 */
export const patchAttr = (el: Element, key: string, value: any) => {
  /** 如果有新值就直接添加上去，没有就直接删除 */
  if (!value) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, value)
  }
}
