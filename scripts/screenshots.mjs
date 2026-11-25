// Takes screenshots of every screen and fails if the page logs a console
// error. Run after `npm run build`:  node scripts/screenshots.mjs
// Output: docs/ (6 shots, desktop + one mobile).
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const CHROME = '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome'
const DIST = new URL('../dist', import.meta.url).pathname
const OUT = new URL('../docs', import.meta.url).pathname

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

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } })

const consoleErrors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => consoleErrors.push(String(err)))

async function shot(p, name) {
  await p.evaluate(() => window.scrollTo(0, 0))
  await p.waitForTimeout(400)
  await p.screenshot({ path: join(OUT, name), fullPage: true })
  console.log('saved', name)
}

await page.goto(base, { waitUntil: 'networkidle' })
await shot(page, '1-check-empty.png')

// Analyse a harsh message to show the gauge, result and softener.
await page.fill(
  '#message-box',
  'You people are useless, nobody has sent their part and the deadline is tomorrow. Stop wasting my time.',
)
await page.click('button:has-text("Check tone")')
await page.waitForSelector('.result-tone')
await shot(page, '2-result-harsh.png')

// Samples view.
await page.click('button:has-text("Sample messages")')
await shot(page, '3-samples.png')

// Load the lecturer email sample and check it.
await page.click('button:has-text("Email to a lecturer")')
await page.click('button:has-text("Check tone")')
await page.waitForSelector('.result-tone')
await shot(page, '4-result-polite.png')

// Teach view with an added example.
await page.click('button:has-text("Teach the model")')
await page.fill('#teach-text', 'This wahala is too much, I am tired of it.')
await page.selectOption('#teach-tone', 'Harsh')
await page.click('button:has-text("Add and retrain")')
await page.waitForTimeout(300)
await shot(page, '5-teach.png')

// Mobile view of the checker with a result.
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
mobile.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
mobile.on('pageerror', (err) => consoleErrors.push(String(err)))
await mobile.goto(base, { waitUntil: 'networkidle' })
await mobile.fill(
  '#message-box',
  'Good morning sir, please may I submit my assignment tomorrow? Thank you for your understanding.',
)
await mobile.click('button:has-text("Check tone")')
await mobile.waitForSelector('.result-tone')
await shot(mobile, '6-mobile.png')

await browser.close()
server.close()

if (consoleErrors.length > 0) {
  console.error('CONSOLE ERRORS:', consoleErrors)
  process.exit(1)
}
console.log('done, zero console errors')
