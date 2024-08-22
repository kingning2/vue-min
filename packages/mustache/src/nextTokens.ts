/**
 * 压缩一下tokens中的#为一层
 * @param tokens tokens数组集
 */
export const nextTokens = (tokens: any[]) => {
  const nextedTokens = [] // 总的数组
  const sections = [] // 栈队列
  // 当收集器发生改变的时候总数组也会发生改变
  let collector = nextedTokens // 收集器
  tokens.forEach((item) => {
    switch (item[0]) {
      case '#':
        // 往总数组添加这个item
        collector.push(item)
        // 往栈队列加
        sections.push(item)
        // 切换任务指向
        collector = item[2] = []
        break
      case '/':
        // 出栈
        sections.pop()
        // 切换任务指向，如果栈里还有东西就用栈里的，没有就指向一开始的
        collector = sections.length ? sections[sections.length - 1][2] : nextedTokens
        break
      default:
        // 往指针数组添加数据
        collector.push(item)
        break
    }
  })
  
  return nextedTokens
}
