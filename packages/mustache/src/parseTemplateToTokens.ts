import { Scanner } from './Scanner'
import { nextTokens } from './nextTokens'

/**
 * 把字符转义为tokens形式的数组
 * @param template
 */
export const parseTemplateToTokens = (template: string) => {
  const tokens = []
  // 创建扫描器
  const scanner = new Scanner(template)
  let word: string; // 扫描过后接收到的字符串
  while (scanner.pos < template.length) {
    // 获取 {{ 前的字符串
    word = scanner.scanUtil('{{')
    if (word) {
      let _word = '';
      let isInjin = false // 判断是否在标签内
      for (let i =0;i<word.length;i++) {
        // 判断是否在标签里面逻辑
        if (word[i] === '<') {
          isInjin = true
        } else if (word[i] === '>') {
          isInjin = false
        }
        // 去掉空格逻辑
        if (word[i].trim()) {
          _word += word[i]
        }else {
          if (isInjin) {
            _word += ' '
          }
        }
      }
      tokens.push(['text', word])
    }
    scanner.scan('{{')
    // 获取 }} 前的字符串
    word = scanner.scanUtil('}}')
    if (word) {
      if (/^#/.test(word)) {
        tokens.push(['#', word.substring(1)])
      } else if (/^\//.test(word)) {
        tokens.push(['/', word.substring(1)])
      } else {
        tokens.push(['name', word])
      }
    }
    scanner.scan('}}')
  }
  return nextTokens(tokens)
}
