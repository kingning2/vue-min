import { lookup } from "./lookup";
import { renderTemplate } from "./renderTemplate"

/**
 * 处理嵌套的问题
 * @param item 第一项为 # 的数组
 * @param data 数据
 * @returns 所拼接的字符串
 */
export const parseArray = (item: any, data: Object) => {
  let renderStr = ''
  // 要循环的次数
  console.log(item[2],data);
  
  const v = lookup(data, item[1])
  v.forEach((child: Object) => {
    // 处理 . 的情况
    renderStr += renderTemplate(item[2],{...child,'.':child})
  })
  return renderStr
}