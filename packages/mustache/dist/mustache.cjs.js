'use strict';

// 扫描类
class Scanner {
    pos; // 指针指到第几位
    tail; // 指针划过剩余字符串
    template; // 原先的字符串
    constructor(template) {
        this.pos = 0;
        this.tail = template;
        this.template = template;
    }
    /**
     * 到指定内容跳过这个字符
     * @param tag 要找到的字符串
     */
    scan(tag) {
        if (this.tail.indexOf(tag) === 0) {
            // 跳过这个字符
            this.pos += 2;
            // 尾部更新
            this.tail = this.template.substring(this.pos);
        }
    }
    /**
     * 指针扫码器，到指定内容停下，并返回之前扫过的内容
     * @param stopTag 要找到的字符串
     */
    scanUtil(stopTag) {
        // 指针开始的位置
        const state_pos = this.pos;
        // 不是以 stopTag 开头，而且指针不能超过字符串长度
        while (this.tail.indexOf(stopTag) !== 0 && this.pos < this.template.length) {
            this.pos++;
            // 获取剩余的字符
            this.tail = this.template.substring(this.pos);
        }
        // 返回扫描过的文字
        return this.template.substring(state_pos, this.pos);
    }
}

/**
 * 压缩一下tokens中的#为一层
 * @param tokens tokens数组集
 */
const nextTokens = (tokens) => {
    const nextedTokens = []; // 总的数组
    const sections = []; // 栈队列
    // 当收集器发生改变的时候总数组也会发生改变
    let collector = nextedTokens; // 收集器
    tokens.forEach((item) => {
        switch (item[0]) {
            case '#':
                // 往总数组添加这个item
                collector.push(item);
                // 往栈队列加
                sections.push(item);
                // 切换任务指向
                collector = item[2] = [];
                break;
            case '/':
                // 出栈
                sections.pop();
                // 切换任务指向，如果栈里还有东西就用栈里的，没有就指向一开始的
                collector = sections.length ? sections[sections.length - 1][2] : nextedTokens;
                break;
            default:
                // 往指针数组添加数据
                collector.push(item);
                break;
        }
    });
    return nextedTokens;
};

/**
 * 把字符转义为tokens形式的数组
 * @param template
 */
const parseTemplateToTokens = (template) => {
    const tokens = [];
    // 创建扫描器
    const scanner = new Scanner(template);
    let word; // 扫描过后接收到的字符串
    while (scanner.pos < template.length) {
        // 获取 {{ 前的字符串
        word = scanner.scanUtil('{{');
        if (word) {
            let _word = '';
            let isInjin = false; // 判断是否在标签内
            for (let i = 0; i < word.length; i++) {
                // 判断是否在标签里面逻辑
                if (word[i] === '<') {
                    isInjin = true;
                }
                else if (word[i] === '>') {
                    isInjin = false;
                }
                // 去掉空格逻辑
                if (word[i].trim()) {
                    _word += word[i];
                }
                else {
                    if (isInjin) {
                        _word += ' ';
                    }
                }
            }
            tokens.push(['text', word]);
        }
        scanner.scan('{{');
        // 获取 }} 前的字符串
        word = scanner.scanUtil('}}');
        if (word) {
            if (/^#/.test(word)) {
                tokens.push(['#', word.substring(1)]);
            }
            else if (/^\//.test(word)) {
                tokens.push(['/', word.substring(1)]);
            }
            else {
                tokens.push(['name', word]);
            }
        }
        scanner.scan('}}');
    }
    return nextTokens(tokens);
};

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

/**
 * 处理嵌套的问题
 * @param item 第一项为 # 的数组
 * @param data 数据
 * @returns 所拼接的字符串
 */
const parseArray = (item, data) => {
    let renderStr = '';
    // 要循环的次数
    console.log(item[2], data);
    const v = lookup(data, item[1]);
    v.forEach((child) => {
        // 处理 . 的情况
        renderStr += renderTemplate(item[2], { ...child, '.': child });
    });
    return renderStr;
};

/**
 * 将 tokens 数组转化为 真实 字符串
 * @param tokens 接收tokens数组
 * @param data 接收过来的数据
 */
const renderTemplate = (tokens, data) => {
    // 结果字符串
    let resultStr = '';
    // console.log(tokens,data);
    tokens.forEach((item) => {
        if (item[0] === 'text') {
            resultStr += item[1];
        }
        else if (item[0] === 'name') {
            resultStr += lookup(data, item[1]);
        }
        else if (item[0] === '#') {
            resultStr += parseArray(item, data);
        }
    });
    return resultStr;
};

// 插值表达式
// 挂载到全局
const SSG_TemplateEngine = {
    /**
     * 渲染到页面函数
     * @param template 要编译的字符串
     * @param data 数据
     */
    render(template, data) {
        // 把传递过来的字符转化为tokens形式
        const token = parseTemplateToTokens(template);
        // 把tokens形式数组转化为真实dom
        const res = renderTemplate(token, data);
        return res;
    },
};

exports.SSG_TemplateEngine = SSG_TemplateEngine;
//# sourceMappingURL=mustache.cjs.js.map
