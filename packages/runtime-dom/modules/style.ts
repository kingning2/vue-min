/**
 * 设置样式
 * @param el 设置样式的节点
 * @param prevValue 上一次设置的值
 * @param nextValue 这一次设置的值
 */
export const patchStyle = (el: Element, prevValue: any, nextValue: any) => {
  const style = (el as HTMLElement).style
  // 判断一下传入过来的新值是否为空，是的话就直接删除
  if (nextValue === '') {
    el.removeAttribute('style')
  } else if (prevValue) {
    /** 如果老值有，新值没有，就把老值删除 */
    for (const key in prevValue) {
      if (style[key] === null) {
        style[key] = ''
      }
    }
  }
  /** 把新的值添加到里面进去 */
  for (const key in nextValue) {
    style[key] = nextValue[key]
  }
}
