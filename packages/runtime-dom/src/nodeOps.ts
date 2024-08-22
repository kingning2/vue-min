/** 操作节点的 */
export const nodeOps =  {
  /**
   * 创建元素节点
   * @param tag 创建哪个元素
   * @returns 
   */
  createElement: (tag: string) => document.createElement(tag),
  /**
   * 删除元素
   * @param child 获取子节点
   * @returns 
   */
  remove: (child: Element) => {
    /** 获取自己的父节点，然后把自己删除掉 */
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },
  /** 
   * 插入元素
   * @param child 获取子节点
   * @param parent 获取父节点
   * @param anchor 获取参照物
   * @returns 
   */
  insert: (child: Element, parent: Element, anchor: Element | null) => {
    /** 如果没有参照物就相当于 appendChild */
    parent.insertBefore(child, anchor)
  },
  /**
   * 选择元素
   * @param selector 要获取的元素名
   * @returns 
   */
  querySelector: (selector: string) => document.querySelector(selector),
  /** 
   * 创建文本节点
   * @param el 要创建的元素
   * @param text 创建的文本
   * @returns 
   */
  createText: (el: Element, text: string) => document.createTextNode(text),
  /** 
   * 设置文本节点
   * @param el 要创建的元素
   * @param text 创建的文本
   * @returns 
   */
  setElementText: (el: Element, text: string) =>  el.textContent = text,
  /**
   * 指定节点上设置文本内容
   * @param node 要设置的节点
   * @param text 文本内容
   * @returns 
   */
  setText: (node, text) => node.nodeValue = text,
}