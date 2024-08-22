var VueReactivity = (function (exports) {
    'use strict';

    const isObject = (target) => {
        return typeof target === 'object' && target !== null;
    };
    const isArray = Array.isArray;
    const isFunction = (val) => typeof val === 'function';
    /** 对象是否具有指定的属性 */
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    const hasOwn = (val, key) => hasOwnProperty.call(val, key);
    /** 判断是否为整数 */
    const isInteger = (val) => parseInt(val) + '' === val;
    /** 判断是否有所变化 */
    const isChanged = (oldVal, newVal) => String(oldVal) !== String(newVal);

    function effect(fn, options = {}) {
        /** 创建一个执行函数 */
        const effect = createReactEffect(fn, options);
        /** 如果传递一个lazy为true则不执行直接返回 */
        if (!options.lazy) {
            effect(); // 默认执行
        }
        return effect;
    }
    // 定义一个id来区别不同的响应式数据
    let uid = 0;
    let effectStack = [];
    let activeEffect = null; // 保存当前的effect
    function createReactEffect(fn, options = {}) {
        /** 执行用户的操作 */
        const effect = function reactiveEffect() {
            try {
                /** 把数据存储进去 */
                effectStack.push(effect);
                activeEffect = effect;
                return fn();
            }
            finally {
                /** 删除数组的最后一个 */
                effectStack.pop();
                /** 获取数组的最后一个赋值给 activeEffect */
                activeEffect = effectStack[effectStack.length - 1];
            }
        };
        effect.id = uid++; // 区别不同的effect
        effect._isEffect = true; // 是不是响应式的
        effect.row = fn; // 用户的执行操作
        effect.options = options; // 保存用户传过来的属性
        return effect;
    }
    let targetMap = new WeakMap(); // 全局对象
    /**
     * 获取视图的时候就执行的操作
     * @param target 要收集的对象
     * @param type 类型
     * @param key 属性
     */
    const Track = (target, type, key) => {
        /** 如果没有在 effect 函数中获取值则直接跳出循环 */
        if (!activeEffect)
            return;
        /** 获取一下这个对象是否有包含target这个属性 */
        let depMap = targetMap.get(target);
        if (!depMap) {
            /** 没有就给这个属性赋值 */
            targetMap.set(target, (depMap = new Map()));
        }
        /** 获取target里面是否有key这个属性 */
        let deps = depMap.get(key);
        if (!deps) {
            /** 没有就给这个属性赋一个数组 */
            depMap.set(key, (deps = new Set()));
        }
        /** 判断deps中有没有 key */
        if (!deps.has(activeEffect)) {
            /** 把effect添加到deps中 */
            deps.add(activeEffect);
        }
    };
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
    const shallowGet = cretaeGetter(false, true);
    const readonlyGet = cretaeGetter(true);
    const shallowReadonlyGet = cretaeGetter(true, true);
    /** 处理set的方法 */
    const set = cretaeSetter();
    const shallowSet = cretaeSetter(true);
    /**
     * 处理get方法
     * @param isReadonly 是否为只读的
     * @param isShallow 是否为浅层的
     */
    function cretaeGetter(isReadonly = false, isShallow = false) {
        return function get(target, key, receiver) {
            /** 如果是响应式数据的则执行 */
            if (!isReadonly) {
                /** 收集依赖 */
                Track(target, "get" /* TrackTypes.GET */, key);
            }
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
    const shallowReactiveHandlers = {
        get: shallowGet,
        set: shallowSet
    };
    /** 这两个函数没有进行代理所以不能设置值 */
    const readonlyHandlers = {
        get: readonlyGet,
        set: (target, key, value) => {
            console.log(`set on key is falid`);
        }
    };
    const shallowReadonlyHandlers = {
        get: shallowReadonlyGet,
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
    /** 浅层监视并且课修改的 */
    function shallowReactive(target) {
        return createReactObj(target, false, shallowReactiveHandlers);
    }
    /** 深层监视并且只读的 */
    function readonly(target) {
        return createReactObj(target, true, readonlyHandlers);
    }
    /** 浅层监视并且只读的 */
    function shallowReadonly(target) {
        return createReactObj(target, true, shallowReadonlyHandlers);
    }
    /** 使用 reactive 代理 */
    const convert = (val) => {
        /** 判断是不是对象的形式 */
        return isObject(val) ? reactive(val) : val;
    };

    const ref = (target) => {
        /**
         * 判断这个数据是复杂数据类型还是简单数据类型
         * ? 简单数据类型就走ref这个模块set
         * ? 复杂数据类型就走reactive这个模块的set
         */
        const targets = convert(target);
        return createRef(targets);
    };
    /** 创建一个 RefImpl 类 */
    class RefImpl {
        _value;
        _v_isShallow;
        _rawValue;
        _v_isRef = true;
        // value: any;
        constructor(target, shallow = false) {
            this._v_isShallow = shallow;
            this._value = target;
            this._rawValue = target;
        }
        get value() {
            Track(this, "get" /* TrackTypes.GET */, 'value');
            return this._value;
        }
        set value(newVal) {
            /** 判断是否有做修改 */
            if (isChanged(this._value, newVal)) {
                this._value = newVal;
                this._rawValue = newVal;
                Trigger(this, "set" /* TiggerTypes.SET */, 'value', newVal);
            }
        }
    }
    /**
     * 创建 ref
     * @param target 参数
     * @param shallow 是否为浅层
     */
    function createRef(target, shallow = false) {
        return new RefImpl(target, shallow);
    }
    const toRef = (target, key) => {
        return createToRef(target, key);
    };
    /** 创建一个 ObjectRef 类 */
    class ObjectRef {
        target;
        key;
        _v_isRef = true;
        constructor(target, key) {
            this.target = target;
            this.key = key;
        }
        get value() {
            /** 返回对象的值 */
            Track(this, "get" /* TrackTypes.GET */, this.key);
            return this.target[this.key];
        }
        set value(newVal) {
            /** 修改对象的值 */
            this.target[this.key] = newVal;
            Trigger(this, "set" /* TiggerTypes.SET */, this.key, newVal);
        }
    }
    function createToRef(target, key) {
        return new ObjectRef(target, key);
    }
    /**
     * 创建一个 toRefs
     * @param obj 要被遍历的对象或者属性
     */
    const toRefs = (obj) => {
        const ret = isArray(obj) ? new Array(obj.length) : {};
        /** 遍历每一个属性 */
        for (const key in obj) {
            ret[key] = toRef(obj, key);
        }
        return ret;
    };

    class computedRefImpl {
        setter;
        _dirty = true; // 默认执行
        effect;
        _value;
        constructor(getter, setter) {
            this.setter = setter;
            /** 默认不执行函数 */
            this.effect = effect(getter, {
                lazy: true,
                run: () => {
                    if (!this._dirty) {
                        this._dirty = true;
                    }
                }
            });
        }
        get value() {
            if (this._dirty) {
                this._value = this.effect();
                this._dirty = false; // 下次就不再执行，除非有新的值
            }
            return this._value;
        }
        set value(newValue) {
            this.setter(newValue);
        }
    }
    const computed = (getterOrOptions) => {
        /** 声明两个全局变量 */
        let getter;
        let setter;
        /** 如果是一个函数的话就直接执行它的操作 */
        if (isFunction(getterOrOptions)) {
            getter = getterOrOptions;
            setter = () => {
                console.warn('computed value is readly,you can not change this value');
            };
        }
        else {
            getter = getterOrOptions.get;
            setter = getterOrOptions.set;
        }
        return new computedRefImpl(getter, setter);
    };

    exports.computed = computed;
    exports.convert = convert;
    exports.effect = effect;
    exports.reactive = reactive;
    exports.readonly = readonly;
    exports.ref = ref;
    exports.shallowReactive = shallowReactive;
    exports.shallowReadonly = shallowReadonly;
    exports.toRef = toRef;
    exports.toRefs = toRefs;

    return exports;

})({});
//# sourceMappingURL=reactivity.global.js.map
