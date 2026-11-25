/**
 * 同时启动前后端开发服务。
 *
 * npm workspaces 的 `npm run dev --workspaces` 是串行执行的：
 * server 的 watch 进程不会退出，web 永远起不来。这里用一个小脚本并行拉起两个进程，
 * 并统一转发日志、处理退出，避免引入额外的并发依赖。
 */
import { spawn } from 'node:child_process'

const isWindows = process.platform === 'win32'
const npmCommand = isWindows ? 'npm.cmd' : 'npm'
// 通过 npm run 启动时能拿到 npm-cli.js 的真实路径，直接用 node 执行可以绕开
// Windows 上 spawn .cmd 必须开 shell 的限制（Node 26 会对此发出弃用警告）
const npmExecPath = process.env.npm_execpath

const targets = [
  { name: 'server', args: ['run', 'dev', '-w', 'apps/server'], color: '\u001b[36m' },
  { name: 'web', args: ['run', 'dev', '-w', 'apps/web'], color: '\u001b[32m' },
]

let shuttingDown = false
const children = []

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (child.exitCode !== null || !child.pid) continue
    if (isWindows) {
      spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { stdio: 'ignore' })
    } else {
      child.kill('SIGTERM')
    }
  }
  setTimeout(() => process.exit(code), 600)
}

function forward(stream, prefix, target) {
  if (!stream) return
  let buffer = ''
  stream.setEncoding('utf8')
  stream.on('data', (chunk) => {
    buffer += chunk
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''
    for (const line of lines) target.write(`${prefix}${line}\n`)
  })
  stream.on('end', () => {
    if (buffer.trim()) target.write(`${prefix}${buffer}\n`)
  })
}

for (const { name, args, color } of targets) {
  const prefix = `${color}[${name}]\u001b[0m `
  const child = npmExecPath
    ? spawn(process.execPath, [npmExecPath, ...args], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
      })
    : spawn(npmCommand, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: isWindows,
        env: process.env,
      })
  children.push(child)

  forward(child.stdout, prefix, process.stdout)
  forward(child.stderr, prefix, process.stderr)

  child.on('error', (error) => {
    console.error(`${prefix}启动失败：${error.message}`)
    shutdown(1)
  })

  child.on('exit', (code, signal) => {
    if (shuttingDown) return
    console.log(`${prefix}进程退出（code=${code ?? 'null'}）`)
    // 任意一端异常退出都收掉另一端，避免留下一个「只能玩一半」的开发环境
    if (code !== 0 || signal) shutdown(code ?? 1)
    else shutdown(0)
  })
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
