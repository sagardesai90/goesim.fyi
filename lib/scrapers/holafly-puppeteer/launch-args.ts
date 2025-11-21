import os from 'os'
import path from 'path'
import type { PuppeteerLaunchOptions } from 'puppeteer'

/**
 * Resolves the Chrome executable path for Puppeteer
 * Automatically detects the correct architecture (arm64 vs x64) on macOS
 *
 * @returns Absolute path to Chrome executable or undefined to use system default
 */
export function resolveChromePath(): string | undefined {
  const homedir = os.homedir()
  const platform = os.platform()
  const arch = os.arch()

  // On macOS with Apple Silicon, try to find arm64 Chrome
  if (platform === 'darwin' && arch === 'arm64') {
    const arm64Paths = [
      // Puppeteer cache - arm64
      path.join(homedir, '.cache/puppeteer/chrome/mac_arm-140.0.7339.207/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
      path.join(homedir, '.cache/puppeteer/chrome/mac-140.0.7339.207/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
      // System Chrome (fallback)
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ]

    // Return the first path that exists
    for (const chromePath of arm64Paths) {
      try {
        if (require('fs').existsSync(chromePath)) {
          return chromePath
        }
      } catch {
        // Continue to next path
      }
    }
  }

  // On macOS with Intel, use x64 Chrome
  if (platform === 'darwin' && arch === 'x64') {
    const x64Path = path.join(
      homedir,
      '.cache/puppeteer/chrome/mac-140.0.7339.207/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
    )

    try {
      if (require('fs').existsSync(x64Path)) {
        return x64Path
      }
    } catch {
      // Fall through
    }
  }

  // For other platforms or if nothing found, return undefined to let Puppeteer use its default
  console.log('[Chrome] Using Puppeteer default Chrome executable')
  return undefined
}

/**
 * Browser launch arguments optimized for scraping
 * These args improve stability, reduce resource usage, and avoid detection
 */
export const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--disable-gpu',
  '--disable-web-security', // Holafly may have CORS restrictions
  '--disable-features=VizDisplayCompositor',
  '--disable-blink-features=AutomationControlled', // Avoid bot detection
]

/**
 * Gets the complete Puppeteer launch configuration for Holafly scraping
 *
 * @returns Puppeteer launch options
 */
export function getHolaflyBrowserConfig(): PuppeteerLaunchOptions {
  const chromePath = resolveChromePath()
  const config: PuppeteerLaunchOptions = {
    headless: true,
    args: BROWSER_ARGS,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  }

  // Only set executablePath if we found a specific Chrome installation
  if (chromePath) {
    config.executablePath = chromePath
  }

  return config
}

/**
 * User agent string that mimics a real browser
 * Updated to match modern Chrome on macOS
 */
export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/**
 * Extra HTTP headers to make requests look more legitimate
 */
export const EXTRA_HEADERS = {
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
}
