// 插值表达式

import { parseTemplateToTokens } from "./parseTemplateToTokens"
import { renderTemplate } from "./renderTemplate"

// 挂载到全局
export const  SSG_TemplateEngine = {
  /**
   * 渲染到页面函数
   * @param template 要编译的字符串
   * @param data 数据
   */
  render(template: string, data: Object) {
    // 把传递过来的字符转化为tokens形式
    const token = parseTemplateToTokens(template)
    // 把tokens形式数组转化为真实dom
    const res = renderTemplate(token, data)
    return res
  },
}
