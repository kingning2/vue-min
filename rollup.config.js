/** 通过rollup进行打包 */

/** 引入相关依赖 */
import resolvePlugin from '@rollup/plugin-node-resolve'; // 解析第三方插件
import json from '@rollup/plugin-json'; // 解析json文件
import path from 'path' // 处理路径的
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import typescript from '@rollup/plugin-typescript';

const require = createRequire(import.meta.url)
const __dirname = fileURLToPath(new URL('.', import.meta.url))
/** 获取父级的packages文件夹 */
const packagesDir = path.resolve(__dirname,'packages');
/** 获取文件夹下的每一个文件夹 */
const packageDir = path.resolve(packagesDir,process.env.TARGET);
/** 获取每个文件夹下的package文件 */
const resolve = p => path.resolve(packageDir,p)
const pkg = require(resolve(`package.json`)); // 获取json文件
/** 获取自定义打包规则 */
const name = path.basename(packageDir)
const outputOptions = {
  "esm-bundler": {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: 'es'
  },
  "cjs": {
    file: resolve(`dist/${name}.cjs.js`),
    format: 'cjs'
  },
  "global": {
    file: resolve(`dist/${name}.global.js`),
    format: 'iife'
  }
}

const options = pkg.buildOptions
function createConfig(format,output) {
  /** 包的名字 */
  output.name = options.name
  /** 包的入口文件 */
  output.sourcemap = true
  return {
    input: resolve(`src/index.ts`),
    output,
    plugins: [
      // 解析json文件
      json(),
      typescript(),
      // 解析第三方插件
      resolvePlugin()
    ]
  }
}
// rollup 需要导出一个配置
export default options.formats.map(format => createConfig(format,outputOptions[format]))