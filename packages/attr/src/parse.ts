import { parseAttrsString } from "./parseAttrsString"

/**
 * 将字符串转化为特定格式
 * @param templateStr 模板字符串
 */
export const parse = (templateStr: string) => {
  let index = 0 // 指针
  let rest = '' // 剩余部分
  let stackNum = [] // 数字栈队列
  let stackStr: any = [{'children': []}] // 文本栈队列
  // 判断是否为 <div> 这种格式的
  const stareRegExp = /^\<([a-z]+[1-6]?)(\s[^\<]+)?\>/ // 开始标记
  const endRegExp = /^\<\/([a-z]+[1-6]?)\>/ // 结束标记
  const wordRegExp = /^([^\<]+)/ // 文本标记
  while (index < templateStr.length - 1) {
    rest = templateStr.substring(index) // 获取剩余部分
    if (stareRegExp.test(rest)) {
      const tag = rest.match(stareRegExp)[1]
      // 属性
      const attrsStr = rest.match(stareRegExp)[2] ? rest.match(stareRegExp)[2] : ''
      const attr = parseAttrsString(attrsStr)
      stackNum.push(tag) // 入栈
      stackStr.push({ 'tag': tag, 'children': [] ,attr}) // 内容入栈
      index += tag.length + 2 + attrsStr.length // <>算两位
    } else if (endRegExp.test(rest)) {
      const endTag = rest.match(endRegExp)[1]
      // 判断是否为闭合标签<div></div>
      const pop_tag = stackNum.pop() // 出栈
      if (endTag === pop_tag) {
        const pop_str = stackStr.pop() // 文字出栈
        // 判断文本栈队列是否还有数据
        if (stackStr.length > 0) {
          stackStr[stackStr.length - 1].children.push(pop_str)
        }
      } else {
        throw new Error('标签不匹配')
      }
      index += endTag.length + 3 // </>算三位
    } else if (wordRegExp.test(rest)) {
      const word = rest.match(wordRegExp)[1]
      // 清除空文本
      if (!/^\s+$/.test(word)) {
        stackStr[stackStr.length - 1].children.push({ 'text': word, 'type': 3 })
      }
      index += word.length
    } else {
      index++
    }
  }
  return stackStr[0].children[0]
}
