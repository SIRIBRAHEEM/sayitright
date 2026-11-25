// Records the SayItRight demo walkthrough with a visible cursor + click
// ripples, paced to the narration segments. Run after `npm run build`:
//   node scripts/record-demo.mjs
// Output: video/walkthrough.webm + video/scene-times.json
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const CHROME = '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUTDIR = join(ROOT, 'video', 'walkthrough')
await mkdir(OUTDIR, { recursive: true })

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (path === '/') path = '/index.html'
  try {
    const body = await readFile(join(DIST, normalize(path)))
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end('not found')
  }
})
await new Promise((r) => server.listen(0, r))
const port = server.address().port
const base = `http://127.0.0.1:${port}/`

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const t0 = Date.now()
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: OUTDIR, size: { width: 1280, height: 800 } },
})
const page = await context.newPage()

// Visible cursor + click ripple overlay, injected before any page script.
await page.addInitScript(() => {
  const install = () => {
    if (document.getElementById('demo-cursor')) return
    const cursor = document.createElement('div')
    cursor.id = 'demo-cursor'
    cursor.style.cssText =
      'position:fixed;left:0;top:0;width:28px;height:28px;z-index:2147483647;' +
      'pointer-events:none;transform:translate(-100px,-100px);' +
      'filter:drop-shadow(0 1px 2px rgba(0,0,0,0.55));'
    cursor.innerHTML =
      '<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M6 3 L22 14 L14.5 15.5 L18 23 L14.8 24.5 L11.3 16.8 L6 21 Z" ' +
      'fill="#ffffff" stroke="#14152a" stroke-width="1.6" stroke-linejoin="round"/></svg>'
    document.documentElement.appendChild(cursor)
    let x = -100
    let y = -100
    const place = () => {
      cursor.style.transform = `translate(${x - 5}px, ${y - 3}px)`
    }
    window.addEventListener(
      'mousemove',
      (e) => {
        x = e.clientX
        y = e.clientY
        place()
      },
      true,
    )
    window.addEventListener(
      'mousedown',
      (e) => {
        const ripple = document.createElement('div')
        ripple.style.cssText =
          `position:fixed;left:${e.clientX - 22}px;top:${e.clientY - 22}px;` +
          'width:44px;height:44px;border-radius:50%;z-index:2147483646;' +
          'pointer-events:none;border:3px solid #ffc24b;opacity:0.95;' +
          'transform:scale(0.35);transition:transform 480ms ease-out, opacity 480ms ease-out;'
        document.documentElement.appendChild(ripple)
        requestAnimationFrame(() => {
          ripple.style.transform = 'scale(1.5)'
          ripple.style.opacity = '0'
        })
        setTimeout(() => ripple.remove(), 520)
      },
      true,
    )
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install)
  } else {
    install()
  }
})

const consoleErrors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => consoleErrors.push(String(err)))

const elapsed = () => (Date.now() - t0) / 1000
const sceneTimes = {}
let sceneStart = 0
function markScene(name) {
  sceneTimes[name] = Number(elapsed().toFixed(2))
  sceneStart = Date.now()
  console.log('scene', name, 'at', sceneTimes[name], 's')
}
async function holdUntil(seconds) {
  const target = sceneStart + seconds * 1000
  const remain = target - Date.now()
  if (remain > 0) await page.waitForTimeout(remain)
}

async function moveToBox(box, steps = 28) {
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps })
}
async function scrollIntoView(locator) {
  for (let i = 0; i < 12; i++) {
    const box = await locator.boundingBox()
    if (!box) throw new Error('no bounding box')
    if (box.y > 60 && box.y + box.height < 760) return box
    const dy = box.y > 400 ? 320 : -320
    await page.mouse.wheel(0, dy)
    await page.waitForTimeout(220)
  }
  return locator.boundingBox()
}
async function clickLoc(locator) {
  const box = await scrollIntoView(locator)
  await moveToBox(box)
  await page.waitForTimeout(280)
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(450)
}
async function typeInto(locator, text) {
  await clickLoc(locator)
  await page.keyboard.type(text, { delay: 52 })
  await page.waitForTimeout(350)
}
async function smoothWheel(dy, steps = 6) {
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy / steps)
    await page.waitForTimeout(110)
  }
}

const navBtn = (label) => page.locator(`.nav button:has-text("${label}")`)
const btn = (label) => page.locator(`button:has-text("${label}")`).first()

await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
sceneTimes.appReady = Number(elapsed().toFixed(2))
console.log('app ready at', sceneTimes.appReady, 's')

// ---------- Scene 1: the problem (empty Check screen) ----------
markScene('s1')
await page.mouse.move(640, 400, { steps: 10 })
await page.waitForTimeout(1200)
await moveToBox(await page.locator('#message-box').boundingBox())
await page.waitForTimeout(2600)
await moveToBox(await btn('Check tone').boundingBox())
await page.waitForTimeout(2600)
await moveToBox(await navBtn('Teach the model').boundingBox())
await page.waitForTimeout(2200)
await moveToBox(await navBtn('Sample messages').boundingBox())
await holdUntil(18)

// ---------- Scene 2a: harsh message ----------
markScene('s2a')
await clickLoc(navBtn('Sample messages'))
await page.waitForTimeout(900)
await clickLoc(page.locator('.sample-card:has-text("Angry group chat message")'))
await page.waitForTimeout(700)
await clickLoc(btn('Check tone'))
await page.waitForSelector('.result-tone')
await page.waitForTimeout(2400)
await smoothWheel(380)
await page.waitForTimeout(1800)
await moveToBox(await page.locator('.softened-box').boundingBox())
await holdUntil(18)

// ---------- Scene 2b: use softer version ----------
markScene('s2b')
await clickLoc(btn('Use this version'))
await smoothWheel(-600)
await page.waitForTimeout(500)
await clickLoc(btn('Check tone'))
await page.waitForSelector('.result-tone')
await holdUntil(7.5)

// ---------- Scene 3: polite email ----------
markScene('s3')
await clickLoc(navBtn('Sample messages'))
await page.waitForTimeout(800)
await clickLoc(page.locator('.sample-card:has-text("Email to a lecturer")'))
await page.waitForTimeout(600)
await clickLoc(btn('Check tone'))
await page.waitForSelector('.result-tone')
await holdUntil(12)

// ---------- Scene 4a: wahala before teaching ----------
markScene('s4a')
await clickLoc(btn('Clear'))
await typeInto(page.locator('#message-box'), 'That was pure wahala, wahala everywhere.')
await clickLoc(btn('Check tone'))
await page.waitForSelector('.result-tone')
await page.waitForTimeout(1600)
await smoothWheel(240)
await holdUntil(17.5)

// ---------- Scene 4b: teach three wahala examples ----------
markScene('s4b')
await smoothWheel(-500)
await clickLoc(navBtn('Teach the model'))
await page.waitForTimeout(900)
await moveToBox(await page.locator('.stat-grid').boundingBox())
await page.waitForTimeout(1400)
await smoothWheel(420)
await typeInto(page.locator('#teach-text'), 'This wahala is too much, I am tired of wahala.')
await clickLoc(page.locator('#teach-tone'))
for (let i = 0; i < 4; i++) {
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(260)
}
await page.keyboard.press('Enter')
await page.waitForTimeout(400)
await clickLoc(btn('Add and retrain'))
await page.waitForTimeout(900)
await typeInto(page.locator('#teach-text'), 'Wahala everywhere, this is a big wahala for everybody.')
await clickLoc(btn('Add and retrain'))
await page.waitForTimeout(900)
await typeInto(page.locator('#teach-text'), 'Too much wahala in this place, I am angry about this wahala.')
await clickLoc(btn('Add and retrain'))
await page.waitForTimeout(900)
await smoothWheel(-560)
await page.waitForTimeout(600)
await moveToBox(await page.locator('.stat-grid').boundingBox())
await holdUntil(22)

// ---------- Scene 4c: wahala after teaching ----------
markScene('s4c')
await clickLoc(navBtn('Check a message'))
await page.waitForTimeout(600)
await clickLoc(btn('Clear'))
await typeInto(page.locator('#message-box'), 'That was pure wahala, wahala everywhere.')
await clickLoc(btn('Check tone'))
await page.waitForSelector('.result-tone')
await page.waitForTimeout(1200)
await smoothWheel(200)
await holdUntil(10.5)

// ---------- Scene 5: sarcasm honesty + close on logo ----------
markScene('s5')
await smoothWheel(-500)
await clickLoc(btn('Clear'))
await typeInto(page.locator('#message-box'), 'Oh great, another delay. Just what I needed today.')
await clickLoc(btn('Check tone'))
await page.waitForSelector('.result-tone')
await page.waitForTimeout(1800)
await smoothWheel(220)
await page.waitForTimeout(1200)
await moveToBox(await page.locator('.logo').boundingBox())
await holdUntil(16.5)

sceneTimes.end = Number(elapsed().toFixed(2))
console.log('end at', sceneTimes.end, 's')

const video = page.video()
await context.close()
const videoPath = await video.path()
await browser.close()
server.close()

await writeFile(join(ROOT, 'video', 'scene-times.json'), JSON.stringify(sceneTimes, null, 2))
console.log('video:', videoPath)
console.log(JSON.stringify(sceneTimes, null, 2))
if (consoleErrors.length > 0) {
  console.error('CONSOLE ERRORS:', consoleErrors)
  process.exit(1)
}
console.log('done, zero console errors')
