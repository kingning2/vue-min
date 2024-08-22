import { isFunction } from '@vue/shared'
import { effect } from '.'

class computedRefImpl {
  public _dirty = true // 默认执行
  public effect
  public _value
  constructor(getter,public setter) {
    /** 默认不执行函数 */
    this.effect = effect(getter, { 
      lazy: true,
      run: () => {
        if(!this._dirty) {
          this._dirty = true
        }
      }
    })
  }
  get value() {
    if (this._dirty) {
      this._value = this.effect()
      this._dirty = false // 下次就不再执行，除非有新的值
    }
    return this._value
  }
  set value(newValue) {
    this.setter(newValue)
  }
}

export const computed = (getterOrOptions) => {
  /** 声明两个全局变量 */
  let getter
  let setter
  /** 如果是一个函数的话就直接执行它的操作 */
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = () => {
      console.warn('computed value is readly,you can not change this value')
    }
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  return new computedRefImpl(getter, setter)
}
