var Attr = (function (exports) {
    'use strict';

    const parseAttrsString = (attrs) => {
        if (!attrs)
            return [];
        let isInQuote = false; // 判断是否在双引号里面
        let point = 0; // 断点
        let res = []; // 结果数组
        for (let i = 0, item; (item = attrs[i++]);) {
            // 在引号里面的内容
            if (item === '"') {
                isInQuote = !isInQuote;
            }
            else if (!isInQuote && item === ' ') {
                // 如果只有空格的话就不匹配
                if (!/^\s*$/.test(attrs.substring(point, i - 1))) {
                    res.push(attrs.substring(point, i).trim()); // 放入到数组里面
                    point = i; // 改变指针位置
                }
            }
        }
        // 循环到最后还有一个没有进入
        res.push(attrs.substring(point).trim());
        // 将 key=val => {name:key,value:val} 的格式
        res = res.map(item => {
            const o = item.match(/^(.+)=(.+)$/);
            return {
                name: o[1],
                value: o[2]
            };
        });
        return res;
    };

    /**
     * 将字符串转化为特定格式
     * @param templateStr 模板字符串
     */
    const parse = (templateStr) => {
        let index = 0; // 指针
        let rest = ''; // 剩余部分
        let stackNum = []; // 数字栈队列
        let stackStr = [{ 'children': [] }]; // 文本栈队列
        // 判断是否为 <div> 这种格式的
        const stareRegExp = /^\<([a-z]+[1-6]?)(\s[^\<]+)?\>/; // 开始标记
        const endRegExp = /^\<\/([a-z]+[1-6]?)\>/; // 结束标记
        const wordRegExp = /^([^\<]+)/; // 文本标记
        while (index < templateStr.length - 1) {
            rest = templateStr.substring(index); // 获取剩余部分
            if (stareRegExp.test(rest)) {
                const tag = rest.match(stareRegExp)[1];
                // 属性
                const attrsStr = rest.match(stareRegExp)[2] ? rest.match(stareRegExp)[2] : '';
                const attr = parseAttrsString(attrsStr);
                stackNum.push(tag); // 入栈
                stackStr.push({ 'tag': tag, 'children': [], attr }); // 内容入栈
                index += tag.length + 2 + attrsStr.length; // <>算两位
            }
            else if (endRegExp.test(rest)) {
                const endTag = rest.match(endRegExp)[1];
                // 判断是否为闭合标签<div></div>
                const pop_tag = stackNum.pop(); // 出栈
                if (endTag === pop_tag) {
                    const pop_str = stackStr.pop(); // 文字出栈
                    // 判断文本栈队列是否还有数据
                    if (stackStr.length > 0) {
                        stackStr[stackStr.length - 1].children.push(pop_str);
                    }
                }
                else {
                    throw new Error('标签不匹配');
                }
                index += endTag.length + 3; // </>算三位
            }
            else if (wordRegExp.test(rest)) {
                const word = rest.match(wordRegExp)[1];
                // 清除空文本
                if (!/^\s+$/.test(word)) {
                    stackStr[stackStr.length - 1].children.push({ 'text': word, 'type': 3 });
                }
                index += word.length;
            }
            else {
                index++;
            }
        }
        return stackStr[0].children[0];
    };

    exports.parse = parse;

    return exports;

})({});
//# sourceMappingURL=attr.global.js.map
