// 创建一个vue实例

import { ref,reactive } from "@vue/reactivity";
import { Complie } from "./Complie";

/*
  new Vue({
    el:"#app",
    data:{
      a:1
    },
    method: {

    }
  })
*/
export class Vue {
  $options: any;
  _data: any;
  constructor (options: any) {
    this.$options = options || {};
    this._data = options.data || undefined;
    // 数据变为响应式
    this._data = reactive(this._data)
    this._initData()
    new Complie(this.$options.el,this)
    // 创建生命周期函数
    options.created ? options.created() : false
  }
  _initData () {
    Object.keys(this._data).forEach(item => {
      Object.defineProperty(this, item, {
        get () {
          return this._data[item]
        },
        set (newValue) {
          this._data[item] = newValue
        }
      })
    })
    
  }
}