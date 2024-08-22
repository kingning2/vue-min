/** 导入fs模块 */
// const execa = require('execa');
import { execa } from 'execa';
/** 获取项目目录 */
/** 过滤非文件夹的内容 */
async function build(target) {
  /** -c 执行rollup配置 + w就是检测数据改变 -env 环境变量 stdio: inherit 子进程在父包中输出 */
  await execa('rollup',['-cw','--environment',`TARGET:${target}`],{stdio: 'inherit'})
}

// build('mustache')
// build('runtime-code')
// build('runtime-dom')
// build('attr')
build('vue')
