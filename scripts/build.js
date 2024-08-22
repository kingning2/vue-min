/** 导入fs模块 */
// const execa = require('execa');
import { execa } from 'execa';
import  fs  from 'fs'
/** 获取项目目录 */
/** 过滤非文件夹的内容 */
const dirs = fs.readdirSync('packages').filter(item => fs.statSync(`packages/${item}`).isDirectory());
async function build(target) {
  /** -c 执行rollup配置 -env 环境变量 stdio: inherit 子进程在父包中输出 */
  await execa('rollup',['-c','--environment',`TARGET:${target}`],{stdio: 'inherit'})
}
/** 并行打包 */
function runParallel(dirs, fn) {
  /** 遍历数组的每一项 */
  const result = []
  for (const item of dirs) {
    /** 把打包的方法追加进去 */
    result.push(fn(item))
  }
  return Promise.all(result)
}
runParallel(dirs,build).then((res) => {
  console.log('成功');
})