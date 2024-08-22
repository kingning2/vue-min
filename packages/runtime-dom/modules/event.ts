/**
 * 设置自定义属性的方法
 * @param el 想要设置的元素
 * @param key 自定义的属性名
 * @param value 获取到的新值
 */
export const patchEvent = (el: any, key: string, value: any) => {
  /** 查看一下缓存里面是否有值，如果没有就给赋值为空对象 */
  const invokers = el._vei || (el._vei = {})
  const exists = invokers[key]
  /** 如果存在并且有新值 */
  if (exists && value) {
    exists.value = value
  } else {
    /** 获取事件的名称 */
    const eventName = key.slice(2).toLowerCase()
    if (eventName) {
      /** 获取事件的处理形式并添加到缓存中去 */
      let invoker = (invokers[eventName] = createInvoker(value))
      /** 添加事件 */
      el.addEventListener(eventName, invoker)
    } else {
      /** 移除事件 */
      el.removeEventListener(eventName, exists)
      invokers[eventName] = null // 清除缓存
    }
  }
}
function createInvoker(value) {
  /** 定义一个invoker函数 */
  const invoker = (e) => {
    invoker.value(e)
  }
  invoker.value = value
  return invoker
}
