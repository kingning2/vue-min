class observer {
  constructor () {}
}

/**
 * 侦听对象的函数
 * @param val 值
 */
export const observe = (val) => {
  if (typeof val === 'object' && val !== null) return
  let ob;
  if (val.__ob__) {
    ob = val.__ob__
  } else {
    ob = new observer()
  }
  return ob
}