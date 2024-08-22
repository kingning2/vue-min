export const parseAttrsString = (attrs: string) => {
  if (!attrs) return []
  let isInQuote = false // 判断是否在双引号里面
  let point = 0 // 断点
  let res = [] // 结果数组
  for (let i = 0, item: string; (item = attrs[i++]); ) {
    // 在引号里面的内容
    if (item === '"') {
      isInQuote = !isInQuote
    } else if (!isInQuote && item === ' ') {
      // 如果只有空格的话就不匹配
      if (!/^\s*$/.test(attrs.substring(point, i - 1))) {
        res.push(attrs.substring(point, i).trim()) // 放入到数组里面
        point = i // 改变指针位置
      }
    }
  }
  // 循环到最后还有一个没有进入
  res.push(attrs.substring(point).trim())
  // 将 key=val => {name:key,value:val} 的格式
  res = res.map(item => {
    const o = item.match(/^(.+)=(.+)$/)
    return {
      name: o[1],
      value: o[2]
    }
  })
  return res
}