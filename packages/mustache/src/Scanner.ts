// 扫描类
export class Scanner {
  public pos:number; // 指针指到第几位
  public tail:string; // 指针划过剩余字符串
  public template:string; // 原先的字符串
  constructor (template: string) {
    this.pos = 0;
    this.tail = template;
    this.template = template;
  }
  /**
   * 到指定内容跳过这个字符
   * @param tag 要找到的字符串
   */
  scan (tag: string) {
    if (this.tail.indexOf(tag) === 0) {
      // 跳过这个字符
      this.pos += 2
      // 尾部更新
      this.tail = this.template.substring(this.pos)
    }
  }

  /**
   * 指针扫码器，到指定内容停下，并返回之前扫过的内容
   * @param stopTag 要找到的字符串
   */
  scanUtil (stopTag: string) {
    // 指针开始的位置
    const state_pos = this.pos
    // 不是以 stopTag 开头，而且指针不能超过字符串长度
    while (this.tail.indexOf(stopTag) !== 0 && this.pos < this.template.length) {
      this.pos++
      // 获取剩余的字符
      this.tail = this.template.substring(this.pos)
    }
    // 返回扫描过的文字
    return this.template.substring(state_pos, this.pos)
  }
}