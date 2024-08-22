'use strict';

const isObject = (target) => {
    return typeof target === 'object' && target !== null;
};
const isArray = Array.isArray;
/** 对象是否具有指定的属性 */
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
/** 判断是否为整数 */
const isInteger = (val) => parseInt(val) + '' === val;
/** 判断是否有所变化 */
const isChanged = (oldVal, newVal) => String(oldVal) !== String(newVal);

let targetMap = new WeakMap(); // 全局对象
/**
 * 修改视图的时候就执行的操作
 * @param target 要收集的对象
 * @param type 类型
 * @param key 属性
 * @param newVal 新值
 * @param oldVal 旧值
 */
const Trigger = (target, type, key, newVal, oldVal) => {
    /** 判断属性里面是否有代理的对象 */
    const depsMap = targetMap.get(target);
    /** 如果没有在视图上运用的话就不会代理 */
    if (!depsMap)
        return;
    let deps = new Set();
    /** 判断属性里面是否有方法 */
    const effects = depsMap.get(key);
    /** 有的话就把所有的方法映射在deps数组中 */
    const add = (effects) => {
        if (effects) {
            /** 对象形式 */
            effects.forEach((effect) => deps.add(effect));
        }
    };
    if (key === 'length' && isArray(target)) {
        /** 数组形式 */
        /** 在处理数组的时候，key === length */
        depsMap.forEach((depVal, key) => {
            if (key === 'length' || key > newVal) {
                add(depVal);
            }
        });
    }
    else {
        /** 可能是对象 */
        if (key !== undefined) {
            add(effects);
        }
        switch (type) {
            case "add" /* TiggerTypes.ADD */:
                if (isArray(target) && isInteger(key)) {
                    add(depsMap.get('length'));
                }
        }
    }
    /**
     * 批量执行数组
     * ! ts类型检查只要加any就能执行函数
     * ? Set数组类型是为了让重复值进行去重
     */
    deps.forEach((eff) => {
        if (eff.options.run) {
            eff.options.run();
        }
        else {
            eff();
        }
    });
};

/** get的方法 */
const get = cretaeGetter();
const readonlyGet = cretaeGetter(true);
/** 处理set的方法 */
const set = cretaeSetter();
/**
 * 处理get方法
 * @param isReadonly 是否为只读的
 * @param isShallow 是否为浅层的
 */
function cretaeGetter(isReadonly = false, isShallow = false) {
    return function get(target, key, receiver) {
        const res = Reflect.get(target, key, receiver);
        /** 如果是浅层的则执行 */
        if (isShallow) {
            return res;
        }
        /** 如果是深层的话则执行递归函数 */
        /** 性能优化之一，如果用到了则会代理，不用到就不会代理 */
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
/**
 * 处理set方法
 * @param isShallow 是否为浅层的
 */
function cretaeSetter(isShallow = false) {
    return function set(target, key, value, receiver) {
        /** 判断是否为数组的格式 */
        const oldVal = target[key]; // 获取老值
        /** 判断是数组还是对象的形式 */
        const hasKey = isArray(target) && isInteger(key) ? Number(key) < target.length : hasOwn(target, key);
        /** 把最新的值设置进去 */
        const res = Reflect.set(target, key, value, receiver);
        /** 判断是新增还是修改状态 */
        if (!hasKey) {
            /** 新增状态 */
            Trigger(target, "add" /* TiggerTypes.ADD */, key, value);
        }
        else {
            /**
             * 判断两个值是否有所改变
             * 有变化才走进条件语句中
             */
            if (isChanged(oldVal, value)) {
                /** 修改状态 */
                Trigger(target, "set" /* TiggerTypes.SET */, key, value);
            }
        }
        return res;
    };
}
const reactiveHandlers = {
    get,
    set
};
/** 这两个函数没有进行代理所以不能设置值 */
const readonlyHandlers = {
    get: readonlyGet,
    set: (target, key, value) => {
        console.log(`set on key is falid`);
    }
};

const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
/**
 * 创建函数的核心代码
 * @param target 目标对象
 * @param isReadonly 是否为只读的
 * @param baseHandlers 公共形参
 */
function createReactObj(target, isReadonly, baseHandlers) {
    /** 监听这个对象是不是一个对象 */
    if (!isObject(target))
        return target;
    /** 判断是否代理过了 */
    const proxyMap = isReadonly ? readonlyMap : reactiveMap;
    const proxyEs = proxyMap.get(target);
    if (proxyEs)
        return proxyEs;
    /** 没代理过就帮忙监听 */
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
}
/**
 * 输出四个函数
 * 区别
 * 1、是否为只读
 * 2、是否为深层监视
 */
/** 深层监视并且可修改的 */
function reactive(target) {
    return createReactObj(target, false, reactiveHandlers);
}
/** 深层监视并且只读的 */
function readonly(target) {
    return createReactObj(target, true, readonlyHandlers);
}

/**
 * 解决obj[a.b.c]获取不到属性名的方法
 * @param dataObj 数据对象
 * @param keyName 键名
 */
const lookup = (dataObj, keyName) => {
    if (keyName.indexOf('.') !== -1 && keyName !== '.') {
        let lastObj = dataObj; // 最后的值
        const keyArr = keyName.split('.');
        keyArr.forEach((key) => {
            lastObj = lastObj[key];
        });
        return lastObj;
    }
    return dataObj[keyName];
};

class Complie {
    $el;
    $vue;
    $fragment;
    constructor(el, vue) {
        this.$el = document.querySelector(el);
        this.$vue = vue;
        if (this.$el) {
            // 挂载函数到节点上
            this.$fragment = this.node2Fragment(this.$el);
            // 开始编译
            this.complie(this.$fragment);
            this.$el.appendChild(this.$fragment);
        }
    }
    node2Fragment(el) {
        // 创建虚拟节点
        const fragment = document.createDocumentFragment();
        let child;
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }
        return fragment;
    }
    complie(el) {
        const child = el.childNodes;
        const reg = /\{\{(.*)\}\}/;
        child.forEach(item => {
            if (item.nodeType === 1) {
                // 如果是元素
                this.compliceElement(item);
            }
            else if (item.nodeType === 3 && reg.test(item.textContent)) {
                const text = item.textContent;
                const name = text.match(reg)[1];
                // 处理插值语法
                item.textContent = lookup(this.$vue._data, name);
                console.log(item);
                // 如果是文本
            }
        });
    }
    compliceElement(el) {
        const elAttrs = el.attributes;
        Array.prototype.slice.call(elAttrs).forEach(item => {
            const name = item.name;
            item.value;
            const complieName = name.substring(2);
            // 给每一个都实现响应式
            if (/^v-(.*)/.test(name)) {
                if (complieName === 'if') {
                    console.log('发现了if指令');
                }
                else if (complieName === 'model') {
                    console.log('发现了model指令');
                }
            }
        });
    }
}

// 创建一个vue实例
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
class Vue {
    $options;
    _data;
    constructor(options) {
        this.$options = options || {};
        this._data = options.data || undefined;
        // 数据变为响应式
        this._data = reactive(this._data);
        this._initData();
        new Complie(this.$options.el, this);
        // 创建生命周期函数
        options.created ? options.created() : false;
    }
    _initData() {
        Object.keys(this._data).forEach(item => {
            Object.defineProperty(this, item, {
                get() {
                    return this._data[item];
                },
                set(newValue) {
                    this._data[item] = newValue;
                }
            });
        });
    }
}

exports.Vue = Vue;
//# sourceMappingURL=vue.cjs.js.map
