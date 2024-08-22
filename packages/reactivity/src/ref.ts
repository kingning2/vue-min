import { isArray, isChanged } from '@vue/shared'
import { Track, Trigger } from './effect'
import { TiggerTypes, TrackTypes } from './operations'
import { convert } from '.'

export const ref = (target) => {
  /** 
   * 判断这个数据是复杂数据类型还是简单数据类型
   * ? 简单数据类型就走ref这个模块set
   * ? 复杂数据类型就走reactive这个模块的set
   */
  const targets = convert(target)
  return createRef(targets)
}

export const shallowRef = (target) => {
  return createRef(target, true)
}

/** 创建一个 RefImpl 类 */
class RefImpl {
  _value: any
  _v_isShallow: boolean
  _rawValue: any
  _v_isRef: boolean = true
  // value: any;
  constructor(target, shallow = false) {
    this._v_isShallow = shallow
    this._value = target
    this._rawValue = target
  }
  get value() {
    Track(this, TrackTypes.GET, 'value')
    return this._value
  }
  set value(newVal) {
    /** 判断是否有做修改 */
    if (isChanged(this._value, newVal)) {
      this._value = newVal
      this._rawValue = newVal
      Trigger(this, TiggerTypes.SET, 'value', newVal)
    }
  }
}

/**
 * 创建 ref
 * @param target 参数
 * @param shallow 是否为浅层
 */
function createRef(target, shallow: boolean = false) {
  return new RefImpl(target, shallow)
}

export const toRef = (target, key) => {
  return createToRef(target, key)
}

/** 创建一个 ObjectRef 类 */
class ObjectRef {
  public _v_isRef = true
  constructor(public target, public key) {}
  get value() {
    /** 返回对象的值 */
    Track(this, TrackTypes.GET, this.key)
    return this.target[this.key]
  }
  set value(newVal) {
    /** 修改对象的值 */
    this.target[this.key] = newVal
    Trigger(this, TiggerTypes.SET, this.key, newVal)
  }
}

function createToRef(target, key) {
  return new ObjectRef(target, key)
}

/**
 * 创建一个 toRefs
 * @param obj 要被遍历的对象或者属性
 */
export const toRefs = (obj) => {
  const ret = isArray(obj) ? new Array(obj.length) : {}
  /** 遍历每一个属性 */
  for (const key in obj) {
    ret[key] = toRef(obj, key)
  }
  return ret
}
