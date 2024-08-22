/**
 * 解决obj[a.b.c]获取不到属性名的方法
 * @param dataObj 数据对象
 * @param keyName 键名
 */
export const lookup = (dataObj: Object, keyName: string) => {
  if (keyName.indexOf('.') !== -1 && keyName !== '.') {
    let lastObj = dataObj; // 最后的值
    const keyArr = keyName.split('.')
    keyArr.forEach((key) => {
      lastObj = lastObj[key]
    })
    return lastObj
  }
  return dataObj[keyName]
}