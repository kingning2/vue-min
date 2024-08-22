import { lookup } from "packages/mustache/src/lookup"

export class Complie {
  $el: Element
  $vue: any
  $fragment: any
  constructor(el: string, vue: any) {
    this.$el = document.querySelector(el)
    this.$vue = vue
    if (this.$el) {
      // 挂载函数到节点上
      this.$fragment = this.node2Fragment(this.$el)
      // 开始编译
      this.complie(this.$fragment)
      this.$el.appendChild(this.$fragment)
    }
  }
  node2Fragment(el: Element) {
    // 创建虚拟节点
    const fragment = document.createDocumentFragment();
    let child;
    while (child = el.firstChild) {
      fragment.appendChild(child);
    }
    return fragment;
  }
  complie (el:any) {
    const child = el.childNodes;
    const reg = /\{\{(.*)\}\}/
    child.forEach(item => {
      
      
      if (item.nodeType === 1) {
        // 如果是元素
        this.compliceElement(item)
      } else if (item.nodeType === 3 && reg.test(item.textContent)) {
        const text = item.textContent
        const name = text.match(reg)[1]
        // 处理插值语法
        item.textContent = lookup(this.$vue._data,name)
        console.log(item);
        // 如果是文本
      }
      
    })
    
  }
  compliceElement (el:Element) {
    const elAttrs = el.attributes
    Array.prototype.slice.call(elAttrs).forEach(item => {
      const name = item.name
      const value = item.value
      const complieName = name.substring(2)
      // 给每一个都实现响应式
      if (/^v-(.*)/.test(name)) {
        if (complieName === 'if') {
          console.log('发现了if指令');
        } else if (complieName === 'model') {
          console.log('发现了model指令');
        }
      }
      
    })
    
  }
}
