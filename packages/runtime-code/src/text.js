// 最长递增序列
const arr = [1, 8, 6, 16, 5, 3, 4, 7]

function getSequence(arr) {
  let arrCopy = arr.slice() // 复制数组
  const len = arr.length // 获取整个长度
  const res = [0] // 子序列索引
  let start, middle, end
  for (let i = 0; i < len; i++) {
    const arrI = arr[i] // 第几个数
    if (arrI !== 0) {
      const resIndex = res[res.length - 1] // 获取当前索引
      if (arrI > arr[resIndex]) {
        arrCopy[i] = resIndex // 记录上一次值的索引
        res.push(i) // 追加到 res 里去
        continue
      }
      start = 0
      end = res.length - 1
      while (start < end) {
        middle = (start + end) >> 1
        if (arrI > arr[res[middle]]) {
          start = middle + 1
        } else {
          end = middle
        }
      }
      if (arrI < arr[res[start]]) {
        if (start > 0) {
          arrCopy[i] = res[start - 1]
        }
        res[start] = i // 替换
      }
    }
  }
  let leng =  res.length// 总长度
  let lastLeng = res[leng - 1] // 最后一个数组的长度
  while (leng--) {
    res[leng] = lastLeng // 把最后一个赋值
    lastLeng = arrCopy[lastLeng] //最后一个变成拷贝后的最后一个数组
  }
  return res
}
console.log(getSequence(arr))
