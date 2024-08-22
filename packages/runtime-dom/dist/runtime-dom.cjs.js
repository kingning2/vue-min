'use strict';

const isObject = (target) => {
    return typeof target === 'object' && target !== null;
};
const isArray = Array.isArray;
const isFunction = (val) => typeof val === 'function';
const isString = (val) => typeof val === 'string';
/** 对象是否具有指定的属性 */
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
/** 判断是否为整数 */
const isInteger = (val) => parseInt(val) + '' === val;
/** 判断是否有所变化 */
const isChanged = (oldVal, newVal) => String(oldVal) !== String(newVal);
/** 判断是否为事件 */
const onRE = /^on[^a-z]/;
const isOn = (key) => onRE.test(key);
/** 对象合并的方法 */
const extend = Object.assign;
/** 判断类型是否相同 */
const isSomeVode = (oldvalue, newVnode) => {
    return oldvalue.type === newVnode.type && oldvalue.key === newVnode.key;
};

/**
 * 设置自定义属性的方法
 * @param el 想要设置的元素
 * @param key 自定义的属性名
 * @param value 获取到的新值
 */
const patchAttr = (el, key, value) => {
    /** 如果有新值就直接添加上去，没有就直接删除 */
    if (!value) {
        el.removeAttribute(key);
    }
    else {
        el.setAttribute(key, value);
    }
};

/**
 * 给元素添加属性
 * @param el 想要设置的节点
 * @param className 添加的类名
 */
const patchClass = (el, className) => {
    if (className === null) {
        // 如果为空的话就直接把之前的类名也去掉
        className = '';
    }
    el.className = className;
};

/**
 * 设置样式
 * @param el 设置样式的节点
 * @param prevValue 上一次设置的值
 * @param nextValue 这一次设置的值
 */
const patchStyle = (el, prevValue, nextValue) => {
    const style = el.style;
    // 判断一下传入过来的新值是否为空，是的话就直接删除
    if (nextValue === '') {
        el.removeAttribute('style');
    }
    else if (prevValue) {
        /** 如果老值有，新值没有，就把老值删除 */
        for (const key in prevValue) {
            if (style[key] === null) {
                style[key] = '';
            }
        }
    }
    /** 把新的值添加到里面进去 */
    for (const key in nextValue) {
        style[key] = nextValue[key];
    }
};

/**
 * 设置自定义属性的方法
 * @param el 想要设置的元素
 * @param key 自定义的属性名
 * @param value 获取到的新值
 */
const patchEvent = (el, key, value) => {
    /** 查看一下缓存里面是否有值，如果没有就给赋值为空对象 */
    const invokers = el._vei || (el._vei = {});
    const exists = invokers[key];
    /** 如果存在并且有新值 */
    if (exists && value) {
        exists.value = value;
    }
    else {
        /** 获取事件的名称 */
        const eventName = key.slice(2).toLowerCase();
        if (eventName) {
            /** 获取事件的处理形式并添加到缓存中去 */
            let invoker = (invokers[eventName] = createInvoker(value));
            /** 添加事件 */
            el.addEventListener(eventName, invoker);
        }
        else {
            /** 移除事件 */
            el.removeEventListener(eventName, exists);
            invokers[eventName] = null; // 清除缓存
        }
    }
};
function createInvoker(value) {
    /** 定义一个invoker函数 */
    const invoker = (e) => {
        invoker.value(e);
    };
    invoker.value = value;
    return invoker;
}

/**
 * 操作节点
 * @param el 要操作的节点
 * @param key 添加的属性类型 例如 class
 * @param prevValue 上一次的值
 * @param nextValue 这一次的值
 */
const patchProp = (el, key, prevValue, nextValue) => {
    switch (key) {
        case 'class':
            patchClass(el, nextValue);
            break;
        case 'style':
            patchStyle(el, prevValue, nextValue);
            break;
        default:
            /** 判断是不是事件 */
            if (isOn(key)) {
                patchEvent(el, key, nextValue);
            }
            else {
                patchAttr(el, key, nextValue);
            }
            break;
    }
};

/** 操作节点的 */
const nodeOps = {
    /**
     * 创建元素节点
     * @param tag 创建哪个元素
     * @returns
     */
    createElement: (tag) => document.createElement(tag),
    /**
     * 删除元素
     * @param child 获取子节点
     * @returns
     */
    remove: (child) => {
        /** 获取自己的父节点，然后把自己删除掉 */
        const parent = child.parentNode;
        if (parent) {
            parent.removeChild(child);
        }
    },
    /**
     * 插入元素
     * @param child 获取子节点
     * @param parent 获取父节点
     * @param anchor 获取参照物
     * @returns
     */
    insert: (child, parent, anchor) => {
        /** 如果没有参照物就相当于 appendChild */
        parent.insertBefore(child, anchor);
    },
    /**
     * 选择元素
     * @param selector 要获取的元素名
     * @returns
     */
    querySelector: (selector) => document.querySelector(selector),
    /**
     * 创建文本节点
     * @param el 要创建的元素
     * @param text 创建的文本
     * @returns
     */
    createText: (el, text) => document.createTextNode(text),
    /**
     * 设置文本节点
     * @param el 要创建的元素
     * @param text 创建的文本
     * @returns
     */
    setElementText: (el, text) => el.textContent = text,
    /**
     * 指定节点上设置文本内容
     * @param node 要设置的节点
     * @param text 文本内容
     * @returns
     */
    setText: (node, text) => node.nodeValue = text,
};

/**
 * 创建虚拟节点
 * @param type 组件上的方法
 * @param props 组件上的属性
 * @param slots 子类
 * @returns vnode 实例对象
 */
const createVnode = (type, props, slots = null) => {
    // 判断是组件还是文本
    let shapeFlag = isString(type)
        ? 1 /* ShapeFlags.ELEMENT */
        : isObject(type)
            ? 4 /* ShapeFlags.STATEFUL_COMPONENT */
            : 0;
    const vnode = {
        _v_isVnode: true,
        type,
        props,
        slots,
        key: props && props.key,
        shapeFlag,
        el: null,
        component: {}
    };
    /** 儿子标识，判断是否有插槽的存在  数组为存在，文本为不存在 */
    normalizeChildren(vnode, slots);
    return vnode;
};
function normalizeChildren(vnode, slots) {
    let type = 0;
    if (!slots) ;
    else if (isArray(slots)) {
        type = 16 /* ShapeFlags.ARRAY_CHILDREN */; // 数组格式
    }
    else {
        type = 8 /* ShapeFlags.TEXT_CHILDREN */; // 文本格式
    }
    /** 与组件进行比对 */
    vnode.shapeFlag = vnode.shapeFlag | type;
}
/**
 * 判断是否为 vnode
 * @param vnode 进行比对的元素
 * @returns
 */
const isVnode = (vnode) => {
    return vnode._v_isVnode;
};
/**
 * 生成子类虚拟dom
 */
const TEXT = Symbol('text');
const CVnode = (child) => {
    if (isObject(child))
        return child;
    return createVnode(TEXT, null, String(child));
};

/**
 * 创建app
 * @param rootComponent 组件
 * @param rootProps 属性
 * @param children 插槽
 * @returns
 */
const ApiCreateApp = (render) => {
    /**
     * @param rootComponent 组件上面的方法 如：setup
     * @param rootProps 组件上面的属性 如：props
     * @param slots 插槽
     * @returns
     */
    return function createApp(rootComponent, rootProps, slots) {
        /** 创建app实例 */
        const app = {
            _component: rootComponent,
            _props: rootProps,
            _container: null,
            mount(container) {
                /** 创建虚拟dom */
                let vnode = createVnode(rootComponent, rootProps, slots); // 创建虚拟节点
                render(vnode, container); // 函数第一次就调用这个接口
            },
        };
        return app;
    };
};

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

const componentPublicIntance = {
    /** 解构出_这个属性 */
    get({ _: instance }, key) {
        // 获取值的时候触发的函数
        /** 解构 props 以及 setupState  */
        const { props, setupState } = instance;
        /** 如果有的话就把这个返回出去 */
        if (hasOwn(props, key)) {
            return props[key];
        }
        else if (hasOwn(setupState, key)) {
            return setupState[key];
        }
    },
    set({ _: instance }, key, value) {
        // 获取值的时候触发的函数
        /** 解构 props 以及 setupState  */
        const { props, setupState } = instance;
        /** 如果有的话就把这个返回出去 */
        if (hasOwn(props, key)) {
            props[key] = value;
        }
        else if (hasOwn(setupState, key)) {
            setupState[key] = value;
        }
    },
};

const getCurrentInstance = () => currentInstance;
const setCurrentInstance = (target) => currentInstance = target;
/**
 * 创建组件
 * @param newVnode vnode
 * @returns 实例对象
 */
const createComponentInstance = (newVnode) => {
    /** 创建组件实例 */
    const instance = {
        newVnode,
        props: {},
        attrs: {},
        setupState: {},
        ctx: {},
        proxy: {},
        isMounted: false,
        type: newVnode.type,
        render: false,
        slots: {},
        subTree: newVnode,
        bm: null,
        m: null,
        bu: null,
        u: null, // 生命周期 onUpdated 函数
    };
    instance.ctx = { _: instance };
    return instance;
};
/**
 * 解析setup函数
 * @param instance 虚拟dom
 */
const setupComponent = (instance) => {
    // instance 创建之后什么东西都没有，直接在这里进行添加属性
    const { props, slots, shapeFlag } = instance.newVnode; // 从虚拟 dom 中取出 props 以及子类
    instance.props = props; // 把属性赋值给组件
    instance.slots = slots; // 把子类（slot）赋值给组件
    /** 判断一下是否有执行状态 */
    const isShapeFlags = shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */;
    if (isShapeFlags) {
        setupStateComponent(instance);
    }
};
let currentInstance;
/**
 * 执行相应的函数
 * @param instance 组件实例
 */
const setupStateComponent = (instance) => {
    /** 函数代理，拔掉外面的一层 instance */
    instance.proxy = new Proxy(instance.ctx, componentPublicIntance);
    // 获取传递过来的函数
    const Component = instance.type;
    const { setup } = Component; // 解构出setup
    if (setup) {
        // 初始化实例对象
        const { bm, m } = instance;
        if (bm) {
            invokeArrayFns(bm);
        }
        currentInstance = instance;
        /** 处理接收过来的两个参数 */
        const setContent = createSetupContext(instance);
        const setupResult = setup(instance.props, setContent);
        // 处理 setup 的返回结果
        handlerSetupResult(instance, setupResult);
        // 清空实例对象
        currentInstance = null;
    }
    else {
        /** 如果不存在 setup */
        finallySetupComponent(instance);
    }
};
// 处理 setup 函数的第二个参数
const createSetupContext = (instance) => {
    return {
        attrs: instance.attrs,
        slots: instance.slots,
        emit: () => { },
        expore: () => { },
    };
};
const finallySetupComponent = (instance) => {
    const component = instance.type;
    // 如果组件实例上没有 render 函数
    if (!instance.render) {
        // 组件上没有 render 渲染函数但是有模板
        if (!component.render && component.template) ;
        instance.render = component.render;
    }
};
/**
 * 处理返回值的结果
 * @param instance 组件实例
 * @param setupResult 返回结果
 */
const handlerSetupResult = (instance, setupResult) => {
    // 判断是不是一个函数
    if (isFunction(setupResult)) {
        /** 把值赋给 render 函数 */
        instance.render = setupResult;
    }
    else if (isObject(setupResult)) {
        /** 把值赋给 setupState */
        instance.setupState = setupResult;
    }
    // 处理我们的 render 函数
    finallySetupComponent(instance);
};

/**
 * 创建一个渲染函数
 * @param renderOptionsDom 兼容不同平台的dom操作
 * @returns
 */
function createRender(renderOptionsDom) {
    /** 收集依赖函数 */
    const setupRenderEffect = (instance, container) => {
        effect(function () {
            // 新增操作
            if (!instance.isMounted) {
                const { bm, m } = instance;
                // 执行生命周期 onBeforeMount
                if (bm) {
                    invokeArrayFns(bm);
                }
                // 获取代理对象
                const proxy = instance.proxy;
                // 保存起来
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                if (subTree) {
                    patch(null, subTree, container);
                    if (m) {
                        invokeArrayFns(m);
                    }
                    instance.isMounted = true; // 切换状态
                }
            }
            else {
                const { bu, u } = instance;
                // 更新操作
                if (bu) {
                    invokeArrayFns(bu);
                }
                let { proxy, subTree: prevTree, render } = instance;
                const nextTree = render.call(proxy, proxy);
                patch(prevTree, nextTree, container);
                prevTree = nextTree; // 覆盖操作
                if (u) {
                    invokeArrayFns(u);
                }
            }
        });
    };
    const { insert: hostInsert, // 插入
    remove: hostRemove, // 删除
    patchProp: hostPatchProp, // 添加属性
    createElement: hostCreateElement, // 创建节点
    createText: hostCreateText, // 创建文本
    setText: hostSetText, // 设置文本
    setElementText: hostSetElementText, // 设置节点文本
     } = renderOptionsDom;
    // ----------------------创建组件---------------------
    /**
     * 创建渲染
     * @param newVnode 渲染的参数
     * @param container 渲染到哪里
     */
    const mountComponent = (newVnode, container) => {
        /** 初始化一个vnode */
        const instance = (newVnode.component =
            createComponentInstance(newVnode));
        /** 解析setup */
        setupComponent(instance);
        /** 处理render函数 */
        setupRenderEffect(instance, container);
    };
    /**
     * 创建组件渲染
     * @param odlVnode 上一次渲染的虚拟dom
     * @param newVnode 这一次渲染的虚拟dom
     * @param container 挂载到哪里
     */
    const processComponent = (oldvalue, newVnode, container) => {
        /**
         * 组件渲染核心
         * 1.先有组件的实例对象
         * 2.解析数据到这个实例对象中
         * 3.创建一个effect函数来进行检测更新
         */
        if (!oldvalue) {
            // 第一次创建
            mountComponent(newVnode, container);
        }
        else {
            // 更新操作
            console.log('组价更新状态');
        }
    };
    // -----------------------------------------------
    // ----------------------创建元素---------------------
    const mountChildren = (el, slots) => {
        // 跑递归的形式
        for (let i = 0, item; (item = slots[i++]);) {
            const child = CVnode(item);
            patch(null, child, el);
        }
    };
    let slotsEl; // 存放数组格式的节点
    /**
     * 创建渲染
     * @param newVnode 渲染的参数
     * @param container 渲染到哪里
     * @param anchor 参照物
     */
    const mountElement = (newVnode, container, anchor) => {
        const { props, slots, type, shapeFlag } = newVnode;
        // 创建元素
        let el = (newVnode.el = hostCreateElement(type));
        // 添加属性
        if (props) {
            for (const key in props) {
                hostPatchProp(el, key, null, props[key]);
            }
        }
        // 处理children的三种方法 string array h函数
        if (slots.slots) {
            const { slots: childSlots, type: childType } = slots;
            const childEl = (childSlots.el = hostCreateElement(childType));
            mountChildren(childEl, childSlots);
        }
        if (slots) {
            if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                // 文本格式处理
                // console.log(el,slots);
                if (isVnode(slots)) {
                    return hostInsert(slotsEl, container, anchor);
                }
                hostSetElementText(el, slots);
            }
            else if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 一开始就有数组格式
                mountChildren(el, slots);
            }
        }
        slotsEl = container;
        // 挂载到元素上
        hostInsert(el, container, anchor);
    };
    /**
     * 比对属性
     * @param el 挂载到哪个函数
     * @param oldProps 原来值的属性
     * @param newProps 修改值的属性
     */
    const patchProps = (el, oldProps, newProps) => {
        for (const key in newProps) {
            const newValue = newProps[key]; // 新值的每一个对象
            const oldValue = oldProps[key]; // 旧值的每一个对象
            // 判断两个对象是否相同
            if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
                hostPatchProp(el, key, oldValue, newValue);
            }
        }
        // 如果新值没有旧值有
        for (const key in oldProps) {
            if (!(key in newProps)) {
                hostPatchProp(el, key, oldProps[key], null);
            }
        }
    };
    /**
     * 比对孩子
     * @param el 挂载到哪个函数
     * @param oldvalue 原来值
     * @param newVnode 修改值
     */
    const patchChild = (el, oldvalue, newVnode) => {
        // 获取子类的属性
        const oldSlots = oldvalue.slots;
        const newSlots = newVnode.slots;
        // 获取子类标识
        const oldShapeFlag = oldvalue.shapeFlag;
        const newShapeFlag = newVnode.shapeFlag;
        // 把文本重新赋值
        if (newShapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
            hostSetElementText(el, newSlots);
        }
        else {
            // 如果旧值不是文本而是数组
            if (oldShapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                patchKeyChild(el, oldSlots, newSlots);
            }
            else {
                hostSetElementText(el, '');
                mountChildren(el, newSlots);
            }
        }
    };
    /**
     * 比对数组格式的孩子
     * @param el 挂载到哪个函数
     * @param oldvalue 原来值
     * @param newVnode 修改值
     */
    const patchKeyChild = (el, oldvalue, newVnode) => {
        let i = 0;
        let oldLength = oldvalue.length - 1;
        let newLength = newVnode.length - 1;
        // 比对方式 先从头开始比对，直到对应不上 ，再从后面比对，直到对应不上
        // 例如 1、2、3、4、5 和 1、2、4、3、5 到3就停止
        // 头部比对
        while (i <= oldLength && i <= newLength) {
            const oldVnode = oldvalue[i];
            const newValue = newVnode[i];
            // 如果
            if (isSomeVode(oldVnode, newValue)) {
                patch(oldVnode, newValue, el);
            }
            else {
                break;
            }
            i++;
        }
        // 尾部比对
        while (i <= oldLength && i <= newLength) {
            const oldVnode = oldvalue[oldLength];
            const newValue = newVnode[newLength];
            if (isSomeVode(oldVnode, newValue)) {
                patch(oldVnode, newValue, el);
            }
            else {
                break;
            }
            oldLength--;
            newLength--;
        }
        // 前追加逻辑
        if (i > oldLength) {
            const nextProps = newLength + 1;
            const anchor = nextProps < newVnode.length ? newVnode[nextProps].el : null;
            // 遍历每一个值
            while (i <= newLength) {
                patch(null, newVnode[i++], el, anchor);
            }
        }
        else if (i > newLength) {
            while (i <= oldLength) {
                unmount(oldvalue[i++]);
            }
        }
        else {
            // 创建映射表
            let s1 = i; // 旧数据
            let s2 = i; // 新数据
            // 解决乱序排列的问题
            const toBePatched = newLength - s2 + 1; //乱序的个数
            const newIndexToPatchMap = new Array(toBePatched).fill(0);
            const keyIndexMap = new Map();
            // 设置表里面的数据
            for (let i = s2; i <= newLength; i++) {
                const childVnode = newVnode[i]; // 获取最新数据的那个孩子
                keyIndexMap.set(childVnode.key, i); // 放入映射表
            }
            // 遍历表里面的数据
            for (let i = s1; i <= oldLength; i++) {
                const oldChildVnode = oldvalue[i];
                const res = keyIndexMap.get(oldChildVnode.key); // 获取表里面的数据
                if (!res) {
                    unmount(oldChildVnode);
                }
                else {
                    newIndexToPatchMap[res - s2] = i; // 老的索引位置
                    patch(oldChildVnode, newVnode[res], el);
                }
            }
            const increasingNewIndexSequence = getSequence(newIndexToPatchMap);
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                let currentIndex = i + s2; // 乱序的索引位置
                const child = newVnode[currentIndex]; //
                const anther = currentIndex + 1 < newVnode.length
                    ? newVnode[currentIndex + 1].el
                    : null;
                if (newIndexToPatchMap[i] === 0) {
                    patch(null, child, el, anther);
                }
                else {
                    if (i !== increasingNewIndexSequence[j]) {
                        hostInsert(child.el, el, anther); // 移动位置
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    };
    /**
     * 最长递增序列
     * @param arr 要排序的数组
     * @returns 排序过后的数组
     */
    function getSequence(arr) {
        let arrCopy = arr.slice(); // 复制数组
        const len = arr.length; // 获取整个长度
        const res = [0]; // 子序列索引
        let start, middle, end;
        for (let i = 0; i < len; i++) {
            const arrI = arr[i]; // 第几个数
            if (arrI !== 0) {
                const resIndex = res[res.length - 1]; // 获取当前索引
                if (arrI > arr[resIndex]) {
                    arrCopy[i] = resIndex; // 记录上一次值的索引
                    res.push(i); // 追加到 res 里去
                    continue;
                }
                // 二分序列
                start = 0;
                end = res.length - 1;
                while (start < end) {
                    middle = (start + end) >> 1;
                    if (arrI > arr[res[middle]]) {
                        start = middle + 1;
                    }
                    else {
                        end = middle;
                    }
                }
                if (arrI < arr[res[start]]) {
                    if (start > 0) {
                        arrCopy[i] = res[start - 1];
                    }
                    res[start] = i; // 替换
                }
            }
        }
        let leng = res.length; // 总长度
        let lastLeng = res[leng - 1]; // 最后一个数组的长度
        while (leng--) {
            res[leng] = lastLeng; // 把最后一个赋值
            lastLeng = arrCopy[lastLeng]; //最后一个变成拷贝后的最后一个数组
        }
        return res;
    }
    /**
     * 比对函数
     * @param odlVnode 上一次渲染的虚拟dom
     * @param newVnode 这一次渲染的虚拟dom
     * @param container 挂载到哪里
     */
    const patchElement = (oldvalue, newVnode, container) => {
        const el = (newVnode.el = oldvalue.el);
        const oldProps = oldvalue.props || {};
        const newProps = newVnode.props || {};
        patchProps(el, oldProps, newProps); // 比对属性
        patchChild(el, oldvalue, newVnode); // 比对儿子
    };
    /**
     * 创建元素渲染
     * @param odlVnode 上一次渲染的虚拟dom
     * @param newVnode 这一次渲染的虚拟dom
     * @param container 挂载到哪里
     * @param anchor 参照物
     */
    const processElement = (oldvalue, newVnode, container, anchor) => {
        // 判断是新增还是更新
        if (!oldvalue) {
            mountElement(newVnode, container, anchor);
        }
        else {
            patchElement(oldvalue, newVnode);
        }
    };
    // -----------------------------------------------
    // ----------------------创建文本---------------------
    /**
     * 创建元素渲染
     * @param odlVnode 上一次渲染的虚拟dom
     * @param newVnode 这一次渲染的虚拟dom
     * @param container 挂载到哪里
     */
    const processText = (oldvalue, newVnode, container) => {
        // 判断是新增还是更新
        if (!oldvalue) {
            console.log(11);
            hostInsert(hostCreateText(container, newVnode.slots), container);
        }
        else {
            console.log('文本更新状态');
        }
    };
    // -----------------------------------------------
    const unmount = (oldvalue) => {
        // 先把之前的给清除
        hostRemove(oldvalue.el);
    };
    /**
     * 渲染逻辑
     * @param oldvalue 上一次渲染的虚拟dom
     * @param newVnode 这一次渲染的虚拟dom
     * @param container 挂载到哪里
     * @param anchor 参照物
     */
    const patch = (oldvalue, newVnode, container, anchor = null) => {
        // type: 传递过来的方法
        // shapeFlag： 比对标识
        const { shapeFlag, type } = newVnode;
        /** 进行比对 */
        // 有旧值且不是同一个类型 例如： div p
        if (oldvalue && !isSomeVode(oldvalue, newVnode)) {
            // 卸载节点
            unmount(oldvalue);
            oldvalue = null;
        }
        switch (type) {
            case TEXT:
                // 处理文本
                processText(oldvalue, newVnode, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    // 创建的是一个元素
                    processElement(oldvalue, newVnode, container, anchor);
                }
                else if (shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 创建的是一个组件
                    processComponent(oldvalue, newVnode, container);
                }
        }
    };
    /**
     * 返回一个对象
     * @param vnode 虚拟dom
     * @param container #app
     * @returns
     */
    let render = (vnode, container) => {
        /** 创建真实dom入口 */
        patch(null, vnode, container);
    };
    return {
        createApp: ApiCreateApp(render), // 因为要把render传递过去，所以在外面加上一层
    };
}

/**
 * 创建真实节点的函数
 * @param type 在哪个位置上放置
 * @param propsOrchildren 接收的样式或者属性
 * @param children 子节点，也可以是嵌套另一个 h 函数
 * @returns 执行 createVnode 函数
 */
function h(type, propsOrchildren, children) {
    // 判断传递多少个参数
    const i = arguments.length;
    /** 只有两个参数的时候 */
    /** type + propsOrchildren  或者 type + children */
    if (i === 2) {
        /** type + propsOrchildren 的情况 */
        // 判断是否为对象以及是不是数组格式
        if (isObject(propsOrchildren) && !isArray(propsOrchildren)) {
            /** 判断是不是vnode节点 */
            if (isVnode(propsOrchildren)) {
                return createVnode(type, null, [propsOrchildren]);
            }
            return createVnode(type, propsOrchildren);
        }
        else {
            /** type + children 的情况 */
            return createVnode(type, null, propsOrchildren);
        }
    }
    else {
        if (i > 3) {
            /** 如果大于三的话就把第二个后面的数全部添加到子类上 */
            children = Array.prototype.slice.call(arguments, 2);
        }
        else {
            children = [children];
        }
        /** 直接创建虚拟 dom */
        return createVnode(type, propsOrchildren, children);
    }
}

/**
 * 创建生命周期函数
 * @param lifeCycle 哪个生命周期
 * @returns 实现函数
 */
const createHook = (lifeCycle) => {
    /**
     * 返回函数值
     * @param hook 用户生命周期的方法
     * @param target 当前组件实例
     *
     */
    return (hook, target = currentInstance) => {
        injectHooks(lifeCycle, hook, target);
    };
};
/**
 * 创建生命周期函数
 * @param type 哪个生命周期
 * @param hook 用户生命周期的方法
 * @param target 当前组件实例
 */
const injectHooks = (type, hook, target = currentInstance) => {
    // 如果没有 setup 函数就直接 return 出去
    if (!target)
        return;
    const hooks = target[type] || (target[type] = []);
    const rap = () => {
        setCurrentInstance(target); // 设置生命周期函数
        hook(); // 执行函数
        setCurrentInstance(null); // 清空生命周期
    };
    hooks.push(rap);
};
// 四个生命周期实现
const onBeforeMount = createHook("bm" /* lifeCycle.BEFOREMOUNT */);
const onMounted = createHook("m" /* lifeCycle.MOUNTED */);
const onBeforeUpdate = createHook("bu" /* lifeCycle.BEFOREUPDATE */);
const onUpdated = createHook("u" /* lifeCycle.UPDATED */);
const invokeArrayFns = (arr) => {
    arr.forEach(fn => fn());
};

/** 出口文件 */
/** 合并操作 */
const renderOptionsDom = extend({ patchProp }, nodeOps);
/**
 * 导出创建app的实例
 * @param rootComponent 组件
 * @param rootProps 属性
 * @param slots 插槽
 * @returns
 */
const createApp = (rootComponent, rootProps, slots) => {
    const app = createRender(renderOptionsDom).createApp(rootComponent, rootProps, slots);
    const { mount } = app;
    /**
     * 挂载组件
     * @param container 挂载到#app
     * @returns
     */
    app.mount = (container) => {
        /** 清空原先的内容 */
        container = renderOptionsDom.querySelector(container);
        container.innerHTML = '';
        mount(container);
    };
    return app;
};

exports.computed = computed;
exports.convert = convert;
exports.createApp = createApp;
exports.createRender = createRender;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.invokeArrayFns = invokeArrayFns;
exports.onBeforeMount = onBeforeMount;
exports.onBeforeUpdate = onBeforeUpdate;
exports.onMounted = onMounted;
exports.onUpdated = onUpdated;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
exports.toRef = toRef;
exports.toRefs = toRefs;
//# sourceMappingURL=runtime-dom.cjs.js.map
