import { ShapeFlags, isSomeVode } from '@vue/shared'
import { ApiCreateApp } from './apiCreateApp'
import { effect } from '@vue/reactivity'
import { createComponentInstance, setupComponent } from './component'
import { instance, vnode } from './type/vnode'
import { CVnode, TEXT, isVnode } from './vnode'
import { invokeArrayFns } from '.'
/**
 * 创建一个渲染函数
 * @param renderOptionsDom 兼容不同平台的dom操作
 * @returns
 */
export function createRender(renderOptionsDom) {
  /** 收集依赖函数 */
  const setupRenderEffect = (instance: instance, container: string) => {
    effect(function () {
      // 新增操作
      if (!instance.isMounted) {
        const { bm, m } = instance
        // 执行生命周期 onBeforeMount
        if (bm) {
          invokeArrayFns(bm)
        }
        // 获取代理对象
        const proxy = instance.proxy
        // 保存起来
        const subTree = (instance.subTree = instance.render.call(proxy, proxy))
        if (subTree) {
          patch(null, subTree, container)
          if (m) {
            invokeArrayFns(m)
          }
          instance.isMounted = true // 切换状态
        }
      } else {
        const { bu, u } = instance
        // 更新操作
        if (bu) {
          invokeArrayFns(bu)
        }
        let { proxy, subTree: prevTree, render } = instance
        const nextTree = render.call(proxy, proxy)
        patch(prevTree, nextTree, container)
        prevTree = nextTree // 覆盖操作
        if (u) {
          invokeArrayFns(u)
        }
      }
    })
  }
  const {
    insert: hostInsert, // 插入
    remove: hostRemove, // 删除
    patchProp: hostPatchProp, // 添加属性
    createElement: hostCreateElement, // 创建节点
    createText: hostCreateText, // 创建文本
    setText: hostSetText, // 设置文本
    setElementText: hostSetElementText, // 设置节点文本
  } = renderOptionsDom
  // ----------------------创建组件---------------------
  /**
   * 创建渲染
   * @param newVnode 渲染的参数
   * @param container 渲染到哪里
   */
  const mountComponent = (newVnode: vnode, container: string) => {
    /** 初始化一个vnode */
    const instance: instance = (newVnode.component =
      createComponentInstance(newVnode))
    /** 解析setup */
    setupComponent(instance)
    /** 处理render函数 */
    setupRenderEffect(instance, container)
  }
  /**
   * 创建组件渲染
   * @param odlVnode 上一次渲染的虚拟dom
   * @param newVnode 这一次渲染的虚拟dom
   * @param container 挂载到哪里
   */
  const processComponent = (
    oldvalue: vnode,
    newVnode: vnode,
    container: string
  ) => {
    /**
     * 组件渲染核心
     * 1.先有组件的实例对象
     * 2.解析数据到这个实例对象中
     * 3.创建一个effect函数来进行检测更新
     */
    if (!oldvalue) {
      // 第一次创建
      mountComponent(newVnode, container)
    } else {
      // 更新操作
      console.log('组价更新状态')
    }
  }
  // -----------------------------------------------
  // ----------------------创建元素---------------------
  const mountChildren = (el: any, slots) => {
    // 跑递归的形式
    for (let i = 0, item; (item = slots[i++]); ) {
      const child = CVnode(item)
      patch(null, child, el)
    }
  }
  let slotsEl:Element; // 存放数组格式的节点
  /**
   * 创建渲染
   * @param newVnode 渲染的参数
   * @param container 渲染到哪里
   * @param anchor 参照物
   */
  const mountElement = (newVnode: vnode, container: Element, anchor) => {
    const { props, slots, type, shapeFlag } = newVnode
    // 创建元素
    let el = (newVnode.el = hostCreateElement(type))
    
    // 添加属性
    
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    // 处理children的三种方法 string array h函数
    if (slots.slots) {
      const { slots: childSlots, type: childType } = slots
      const childEl = (childSlots.el = hostCreateElement(childType))
      mountChildren(childEl, childSlots)
    }
    if (slots) {
      if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 文本格式处理
        // console.log(el,slots);
        if (isVnode(slots)) {
          return hostInsert(slotsEl, container, anchor)
        }
        hostSetElementText(el, slots)
      } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 一开始就有数组格式
        mountChildren(el, slots)
      }
    }
    slotsEl = container
    // 挂载到元素上
    hostInsert(el, container, anchor)
  }
  /**
   * 比对属性
   * @param el 挂载到哪个函数
   * @param oldProps 原来值的属性
   * @param newProps 修改值的属性
   */
  const patchProps = (el: string, oldProps: object, newProps: object) => {
    for (const key in newProps) {
      const newValue = newProps[key] // 新值的每一个对象
      const oldValue = oldProps[key] // 旧值的每一个对象
      // 判断两个对象是否相同
      if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
        hostPatchProp(el, key, oldValue, newValue)
      }
    }
    // 如果新值没有旧值有
    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }
  }
  /**
   * 比对孩子
   * @param el 挂载到哪个函数
   * @param oldvalue 原来值
   * @param newVnode 修改值
   */
  const patchChild = (el: string, oldvalue: any, newVnode: any) => {
    // 获取子类的属性
    const oldSlots = oldvalue.slots
    const newSlots = newVnode.slots
    // 获取子类标识
    const oldShapeFlag = oldvalue.shapeFlag
    const newShapeFlag = newVnode.shapeFlag
    // 把文本重新赋值
    if (newShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, newSlots)
    } else {
      // 如果旧值不是文本而是数组
      if (oldShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        patchKeyChild(el, oldSlots, newSlots)
      } else {
        hostSetElementText(el, '')
        mountChildren(el, newSlots)
      }
    }
  }
  /**
   * 比对数组格式的孩子
   * @param el 挂载到哪个函数
   * @param oldvalue 原来值
   * @param newVnode 修改值
   */
  const patchKeyChild = (el: string, oldvalue: any, newVnode: any) => {
    let i = 0
    let oldLength = oldvalue.length - 1
    let newLength = newVnode.length - 1
    // 比对方式 先从头开始比对，直到对应不上 ，再从后面比对，直到对应不上
    // 例如 1、2、3、4、5 和 1、2、4、3、5 到3就停止
    // 头部比对
    while (i <= oldLength && i <= newLength) {
      const oldVnode = oldvalue[i]
      const newValue = newVnode[i]
      // 如果

      if (isSomeVode(oldVnode, newValue)) {
        patch(oldVnode, newValue, el)
      } else {
        break
      }
      i++
    }
    // 尾部比对
    while (i <= oldLength && i <= newLength) {
      const oldVnode = oldvalue[oldLength]
      const newValue = newVnode[newLength]
      if (isSomeVode(oldVnode, newValue)) {
        patch(oldVnode, newValue, el)
      } else {
        break
      }
      oldLength--
      newLength--
    }
    // 前追加逻辑
    if (i > oldLength) {
      const nextProps = newLength + 1
      const anchor = nextProps < newVnode.length ? newVnode[nextProps].el : null
      // 遍历每一个值
      while (i <= newLength) {
        patch(null, newVnode[i++], el, anchor)
      }
    } else if (i > newLength) {
      while (i <= oldLength) {
        unmount(oldvalue[i++])
      }
    } else {
      // 创建映射表
      let s1 = i // 旧数据
      let s2 = i // 新数据
      // 解决乱序排列的问题
      const toBePatched = newLength - s2 + 1 //乱序的个数
      const newIndexToPatchMap = new Array(toBePatched).fill(0)
      const keyIndexMap = new Map()
      // 设置表里面的数据
      for (let i = s2; i <= newLength; i++) {
        const childVnode = newVnode[i] // 获取最新数据的那个孩子
        keyIndexMap.set(childVnode.key, i) // 放入映射表
      }
      // 遍历表里面的数据
      for (let i = s1; i <= oldLength; i++) {
        const oldChildVnode = oldvalue[i]
        const res = keyIndexMap.get(oldChildVnode.key) // 获取表里面的数据
        if (!res) {
          unmount(oldChildVnode)
        } else {
          newIndexToPatchMap[res - s2] = i // 老的索引位置
          patch(oldChildVnode, newVnode[res], el)
        }
      }
      const increasingNewIndexSequence = getSequence(newIndexToPatchMap)
      let j = increasingNewIndexSequence.length - 1
      for (let i = toBePatched - 1; i >= 0; i--) {
        let currentIndex = i + s2 // 乱序的索引位置
        const child = newVnode[currentIndex] //
        const anther =
          currentIndex + 1 < newVnode.length
            ? newVnode[currentIndex + 1].el
            : null
        if (newIndexToPatchMap[i] === 0) {
          patch(null, child, el, anther)
        } else {
          if (i !== increasingNewIndexSequence[j]) {
            hostInsert(child.el, el, anther) // 移动位置
          } else {
            j--
          }
        }
      }
    }
  }

  /**
   * 最长递增序列
   * @param arr 要排序的数组
   * @returns 排序过后的数组
   */
  function getSequence(arr: number[]): number[] {
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
        // 二分序列
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
    let leng = res.length // 总长度
    let lastLeng = res[leng - 1] // 最后一个数组的长度
    while (leng--) {
      res[leng] = lastLeng // 把最后一个赋值
      lastLeng = arrCopy[lastLeng] //最后一个变成拷贝后的最后一个数组
    }
    return res
  }
  /**
   * 比对函数
   * @param odlVnode 上一次渲染的虚拟dom
   * @param newVnode 这一次渲染的虚拟dom
   * @param container 挂载到哪里
   */
  const patchElement = (
    oldvalue: vnode,
    newVnode: vnode,
    container: string
  ) => {
    const el = (newVnode.el = oldvalue.el)
    const oldProps = oldvalue.props || {}
    const newProps = newVnode.props || {}
    patchProps(el, oldProps, newProps) // 比对属性
    patchChild(el, oldvalue, newVnode) // 比对儿子
  }
  /**
   * 创建元素渲染
   * @param odlVnode 上一次渲染的虚拟dom
   * @param newVnode 这一次渲染的虚拟dom
   * @param container 挂载到哪里
   * @param anchor 参照物
   */
  const processElement = (
    oldvalue: vnode,
    newVnode: vnode,
    container: any,
    anchor
  ) => {
    // 判断是新增还是更新
    if (!oldvalue) {
      mountElement(newVnode, container, anchor)
    } else {
      patchElement(oldvalue, newVnode, container)
    }
  }
  // -----------------------------------------------
  // ----------------------创建文本---------------------
  /**
   * 创建元素渲染
   * @param odlVnode 上一次渲染的虚拟dom
   * @param newVnode 这一次渲染的虚拟dom
   * @param container 挂载到哪里
   */
  const processText = (oldvalue: vnode, newVnode: vnode, container: string) => {
    // 判断是新增还是更新
    if (!oldvalue) {
      console.log(11)

      hostInsert(hostCreateText(container, newVnode.slots), container)
    } else {
      console.log('文本更新状态')
    }
  }
  // -----------------------------------------------
  const unmount = (oldvalue: vnode) => {
    // 先把之前的给清除
    hostRemove(oldvalue.el)
  }
  /**
   * 渲染逻辑
   * @param oldvalue 上一次渲染的虚拟dom
   * @param newVnode 这一次渲染的虚拟dom
   * @param container 挂载到哪里
   * @param anchor 参照物
   */
  const patch = (
    oldvalue: vnode | null,
    newVnode: vnode,
    container: string,
    anchor = null
  ) => {
    // type: 传递过来的方法
    // shapeFlag： 比对标识
    const { shapeFlag, type } = newVnode

    /** 进行比对 */
    // 有旧值且不是同一个类型 例如： div p
    if (oldvalue && !isSomeVode(oldvalue, newVnode)) {
      // 卸载节点
      unmount(oldvalue)
      oldvalue = null
    }
    switch (type) {
      case TEXT:
        // 处理文本
        processText(oldvalue, newVnode, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 创建的是一个元素
          processElement(oldvalue, newVnode, container, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 创建的是一个组件
          processComponent(oldvalue, newVnode, container)
        }
    }
  }
  /**
   * 返回一个对象
   * @param vnode 虚拟dom
   * @param container #app
   * @returns
   */
  let render = (vnode: vnode, container: string) => {
    /** 创建真实dom入口 */
    patch(null, vnode, container)
  }
  return {
    createApp: ApiCreateApp(render), // 因为要把render传递过去，所以在外面加上一层
  }
}
