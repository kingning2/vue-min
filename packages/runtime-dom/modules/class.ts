/**
 * 给元素添加属性
 * @param el 想要设置的节点
 * @param className 添加的类名
 */
export const patchClass = (el: Element, className: string) => {
  if (className === null) {
    // 如果为空的话就直接把之前的类名也去掉
    className = '';
  }
  el.className = className;
}