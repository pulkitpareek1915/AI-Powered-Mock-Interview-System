const puppeteer = require("puppeteer")

/* ---------- one shared browser, relaunched if it dies ---------- */
let browserPromise = null

function getBrowser() {
    if (!browserPromise) {
        browserPromise = puppeteer
            .launch({
                headless: true,
                // Docker often needs this. Use it only inside a locked-down container.
                args: process.env.PUPPETEER_NO_SANDBOX === "true" ? ["--no-sandbox", "--disable-setuid-sandbox"] : []
            })
            .then((browser) => {
                browser.on("disconnected", () => { browserPromise = null })
                return browser
            })
            .catch((err) => { browserPromise = null; throw err })
    }
    return browserPromise
}

/* ---------- tiny semaphore: limit concurrent renders ---------- */
const MAX_CONCURRENT = 2
let active = 0
const waiters = []

function acquire() {
    return new Promise((resolve) => {
        if (active < MAX_CONCURRENT) { active++; resolve() }
        else waiters.push(resolve)
    })
}
function release() {
    const next = waiters.shift()
    if (next) next()          // hand the slot straight to the next waiter
    else active--
}

/* ---------- render ---------- */
async function renderPdfFromHtml(html) {
    await acquire()
    let context
    try {
        const browser = await getBrowser()
        context = await browser.createBrowserContext()       // isolated, like an incognito window
        const page = await context.newPage()
        page.setDefaultTimeout(20000)

        // MAIN DEFENCE: no network at all (blocks SSRF). Only inline data is allowed.
        await page.setRequestInterception(true)
        page.on("request", (req) => {
            const url = req.url()
            if (url.startsWith("data:") || url === "about:blank") req.continue()
            else req.abort()
        })

        // bonus: no scripts. If setContent fails in your version with this, remove it and sanitize the HTML instead.
        await page.setJavaScriptEnabled(false)

        await page.setContent(html, { waitUntil: "load" })

        const pdf = await page.pdf({
            format: "A4",
            printBackground: true,                           // keep CSS background colors
            margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
            timeout: 20000
        })
        return Buffer.from(pdf)
    } finally {
        if (context) await context.close().catch(() => {})   // always clean up, even on errors
        release()
    }
}

module.exports = { renderPdfFromHtml }
