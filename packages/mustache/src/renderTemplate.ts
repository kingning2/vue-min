import { isArray } from "@vue/shared";
import { lookup } from "./lookup";
import { parseArray } from "./parseArray";

/**
 * 将 tokens 数组转化为 真实 字符串
 * @param tokens 接收tokens数组
 * @param data 接收过来的数据
 */
export const renderTemplate = (tokens: any[], data: any) => {
  // 结果字符串
  let resultStr = '';
  // console.log(tokens,data);
  tokens.forEach((item) => {
    if (item[0] === 'text') {
      resultStr += item[1];
    } else if (item[0] === 'name') {
      resultStr += lookup(data, item[1]);
    } else if (item[0] === '#') {
      resultStr += parseArray(item,data)
    }
  })
  return resultStr
}
