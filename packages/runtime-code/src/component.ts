import { ShapeFlags, isFunction, isObject } from '@vue/shared'
import { componentPublicIntance } from './componentPublicIntance'
import { instance, vnode } from './type/vnode'
import { invokeArrayFns } from '.'
export const getCurrentInstance = () => currentInstance
export const setCurrentInstance = (target: instance | null) => currentInstance = target
/**
 * 创建组件
 * @param newVnode vnode
 * @returns 实例对象
 */
export const createComponentInstance = (newVnode: vnode):instance => {
  /** 创建组件实例 */
  const instance = {
    newVnode, // 组件
    props: {}, // 组件属性
    attrs: {}, // 获取组件所有属性
    setupState: {}, // setup 返回值
    ctx: {}, // 代理
    proxy: {}, // 通过这个来进行代理
    isMounted: false, // 是否挂载过了
    type: newVnode.type, // 组件类型
    render: false, // 渲染函数
    slots: {}, // 插槽
    subTree:newVnode, // vnode的返回值
    bm: null, // 生命周期 onBeforeMount 函数
    m: null, // 生命周期 onMounted 函数
    bu: null, // 生命周期 onBeforeUpdate 函数
    u: null, // 生命周期 onUpdated 函数
  }
  instance.ctx = { _: instance }
  return instance
}

/**
 * 解析setup函数
 * @param instance 虚拟dom
 */
export const setupComponent = (instance:instance) => {
  // instance 创建之后什么东西都没有，直接在这里进行添加属性
  const { props, slots, shapeFlag } = instance.newVnode // 从虚拟 dom 中取出 props 以及子类
  instance.props = props // 把属性赋值给组件
  instance.slots = slots // 把子类（slot）赋值给组件
  /** 判断一下是否有执行状态 */
  const isShapeFlags = shapeFlag & ShapeFlags.STATEFUL_COMPONENT
  if (isShapeFlags) {
    setupStateComponent(instance)
  }
}

export let currentInstance;
/**
 * 执行相应的函数
 * @param instance 组件实例
 */
const setupStateComponent = (instance: instance) => {
  /** 函数代理，拔掉外面的一层 instance */
  instance.proxy = new Proxy(instance.ctx, componentPublicIntance)
  // 获取传递过来的函数
  
  const Component = instance.type
  const { setup } = Component // 解构出setup
  
  if (setup) {
    // 初始化实例对象
    const {bm,m} = instance
    if (bm) {
      invokeArrayFns(bm)
    }
    currentInstance = instance
    /** 处理接收过来的两个参数 */
    const setContent = createSetupContext(instance)
    const setupResult = setup(instance.props, setContent)
    // 处理 setup 的返回结果
    handlerSetupResult(instance, setupResult)
    // 清空实例对象
    currentInstance = null
    
  } else {
    /** 如果不存在 setup */
    
    finallySetupComponent(instance)
  }
}
// 处理 setup 函数的第二个参数
const createSetupContext = (instance:instance) => {
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: () => {},
    expore: () => {},
  }
}


const finallySetupComponent = (instance:instance) => {
  const component = instance.type
  // 如果组件实例上没有 render 函数
  if (!instance.render) {
    // 组件上没有 render 渲染函数但是有模板
    if (!component.render && component.template) {
      // 把 template 变成 render 函数
    }
    instance.render = component.render
  }
}

/**
 * 处理返回值的结果
 * @param instance 组件实例
 * @param setupResult 返回结果
 */
const handlerSetupResult = (instance:instance, setupResult:() => any | {}) => {
  // 判断是不是一个函数
  if (isFunction(setupResult)) {
    /** 把值赋给 render 函数 */
    instance.render = setupResult
  } else if (isObject(setupResult)) {
    /** 把值赋给 setupState */
    instance.setupState = setupResult
  }
  // 处理我们的 render 函数
  
  finallySetupComponent(instance)
}
