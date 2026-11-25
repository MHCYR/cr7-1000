import { execFileSync } from 'node:child_process'
import { arch, cpus, platform, release } from 'node:os'
import { chromium } from 'playwright'
import { preview } from 'vite'

const host = '127.0.0.1'
const port = 5174
const cpuRate = 4
const phases = { entryMs: 4000, tunnelStart: 0.05, settleMs: 1000, tunnelMs: 10000 }
const profiles = [
  ['Desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false }],
  ['Móvil emulado', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }],
]

function installSampler({ entryMs, tunnelStart, settleMs, tunnelMs }) {
  // Keep the randomly chosen portrait reproducible across runs.
  let seed = 31
  Math.random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
    return seed / 2 ** 32
  }

  function measure(duration, update = () => {}) {
    return new Promise((resolve) => {
      const intervals = []
      let start
      let previous

      function frame(now) {
        start ??= now
        if (previous !== undefined) intervals.push(now - previous)
        previous = now

        const progress = Math.min(1, (now - start) / duration)
        update(progress)
        if (progress === 1) resolve(intervals)
        else requestAnimationFrame(frame)
      }

      requestAnimationFrame(frame)
    })
  }

  async function record() {
    const entry = await measure(entryMs)
    const root = document.scrollingElement
    const end = root.scrollHeight - root.clientHeight
    const start = end * tunnelStart
    const scroll = (top) => window.scrollTo({ top, behavior: 'instant' })

    scroll(start)
    await new Promise((resolve) => setTimeout(resolve, settleMs))
    const tunnel = await measure(tunnelMs, (progress) => scroll(start + (end - start) * progress))
    await new Promise(requestAnimationFrame)

    window.perfResult = {
      entry,
      tunnel,
      end,
      reached: window.scrollY,
      portrait: localStorage.getItem('cr7:last-portrait'),
      canvas: [document.querySelector('canvas').width, document.querySelector('canvas').height],
    }
  }

  // The canvas exists before the asynchronous portrait is ready.
  const gl = WebGL2RenderingContext.prototype
  const drawArrays = gl.drawArrays
  gl.drawArrays = function (mode, first, count) {
    if (mode === this.POINTS && count > 0) {
      gl.drawArrays = drawArrays
      void record()
    }
    return drawArrays.call(this, mode, first, count)
  }
}

function summarize(intervals) {
  const sorted = intervals.toSorted((a, b) => a - b)
  const total = intervals.reduce((sum, interval) => sum + interval, 0)
  const percentile = (p) => sorted[Math.ceil(sorted.length * p) - 1]
  return [intervals.length, 1000 * intervals.length / total, percentile(0.5), percentile(0.95)]
}

async function measureProfile(browser, options) {
  const context = await browser.newContext({ ...options, reducedMotion: 'no-preference' })
  try {
    const page = await context.newPage()
    const session = await context.newCDPSession(page)
    await session.send('Emulation.setCPUThrottlingRate', { rate: cpuRate })
    await page.addInitScript(installSampler, phases)
    const response = await page.goto(`http://${host}:${port}`, { waitUntil: 'commit' })
    if (!response?.ok()) throw new Error(`Preview returned HTTP ${response?.status()}`)

    await page.waitForFunction(() => window.perfResult, undefined, { timeout: 90000, polling: 250 })
    const result = await page.evaluate(() => window.perfResult)
    if (!result.end || Math.abs(result.end - result.reached) > 1) {
      throw new Error(`Tunnel scroll reached ${result.reached} of ${result.end} px`)
    }
    return result
  } finally {
    await context.close()
  }
}

const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()
const server = await preview({ preview: { host, port, strictPort: true, open: false } })
try {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  })
  try {
    const session = await browser.newBrowserCDPSession()
    const { gpu } = await session.send('SystemInfo.getInfo')
    const renderer = gpu.auxAttributes.glRenderer
    if (!/SwiftShader/i.test(renderer)) throw new Error(`Expected SwiftShader, got ${renderer}`)

    console.log(`Commit ${commit} · Chrome ${browser.version()} · CPU ${cpuRate}× · ${renderer}`)
    console.log(`${platform()} ${release()} ${arch()} · ${cpus()[0].model}`)
    console.log('| Perfil | Fase | Frames | FPS medio | p50 (ms) | p95 (ms) |')
    console.log('| --- | --- | ---: | ---: | ---: | ---: |')

    const details = []
    for (const [profile, options] of profiles) {
      const result = await measureProfile(browser, options)
      for (const [phase, intervals] of [['Entrada del retrato', result.entry], ['Túnel', result.tunnel]]) {
        const [frames, ...metrics] = summarize(intervals)
        console.log(`| ${profile} | ${phase} | ${frames} | ${metrics.map((value) => value.toFixed(2)).join(' | ')} |`)
      }
      details.push(`${profile}: ${result.portrait} · canvas ${result.canvas.join('×')} · scroll máximo ${result.end} px`)
    }
    console.log(details.join('\n'))
  } finally {
    await browser.close()
  }
} finally {
  await server.close()
}
