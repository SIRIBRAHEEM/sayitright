// Takes screenshots of every screen and fails if the page logs a console
// error. Run after `npm run build`:  node scripts/screenshots.mjs
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const CHROME = '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome'
const DIST = new URL('../dist', import.meta.url).pathname
const OUT = new URL('../screenshots', import.meta.url).pathname

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
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } })

const consoleErrors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => consoleErrors.push(String(err)))

async function shot(name) {
  await page.waitForTimeout(350)
  await page.screenshot({ path: join(OUT, name), fullPage: true })
  console.log('saved', name)
}

await page.goto(base, { waitUntil: 'networkidle' })
await shot('01-check-empty.png')

// Analyse a harsh message to show the result and softener.
await page.fill(
  '#message-box',
  'You people are useless, nobody has sent their part and the deadline is tomorrow. Stop wasting my time.',
)
await page.click('button:has-text("Check tone")')
await page.waitForSelector('.result-tone')
await shot('02-result-harsh.png')

// Samples view, then load the lecturer email sample.
await page.click('button:has-text("Sample messages")')
await shot('03-samples.png')
await page.click('button:has-text("Email to a lecturer")')
await page.click('button:has-text("Check tone")')
await page.waitForSelector('.result-tone')
await shot('04-result-polite.png')

// Teach view with an added example.
await page.click('button:has-text("Teach the model")')
await shot('05-teach.png')
await page.fill('#teach-text', 'This wahala is too much, I am tired of it.')
await page.selectOption('#teach-tone', 'Harsh')
await page.click('button:has-text("Add and retrain")')
await page.waitForTimeout(300)
await shot('06-teach-added.png')

// History view should now list the two checks.
await page.click('button:has-text("History")')
await shot('07-history.png')

await browser.close()
server.close()

if (consoleErrors.length > 0) {
  console.error('CONSOLE ERRORS:', consoleErrors)
  process.exit(1)
}
console.log('done, zero console errors')
