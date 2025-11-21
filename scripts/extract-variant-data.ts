/**
 * Script to extract variant pricing data from Holafly pages
 * The data is embedded in the HTML as JSON in Astro Island props
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../.env') })

import puppeteer from 'puppeteer'
import { getHolaflyBrowserConfig, USER_AGENT, EXTRA_HEADERS } from '../lib/scrapers/holafly-puppeteer/launch-args'
import { buildHolaflyCountryUrl } from '../lib/scrapers/holafly-puppeteer/country-slugs'

interface VariantPrice {
  currency: string
  amount: string
}

interface Variant {
  id: string
  name: string
  days: string
  gigas: string
  destiny: string
  description: string
  prices: VariantPrice[]
}

async function extractVariantData() {
  console.log('========================================')
  console.log('Holafly Variant Data Extraction')
  console.log('========================================\n')

  const browser = await puppeteer.launch(getHolaflyBrowserConfig())
  const page = await browser.newPage()

  await page.setUserAgent(USER_AGENT)
  await page.setExtraHTTPHeaders(EXTRA_HEADERS)

  const countryUrl = buildHolaflyCountryUrl('US')
  console.log(`📍 Navigating to: ${countryUrl}\n`)

  await page.goto(countryUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  })

  await new Promise(resolve => setTimeout(resolve, 3000))

  console.log('🔍 Extracting variant data from page HTML...\n')

  const variants = await page.evaluate(() => {
    const html = document.documentElement.outerHTML

    // Look for the astro-island props that contain variant data
    // Pattern: props="{...variants...}"
    const propsPattern = /props="({[^"]*&quot;variants&quot;[^"]*)"/g
    const matches = html.match(propsPattern)

    if (!matches || matches.length === 0) {
      return null
    }

    // Take the first match
    const propsString = matches[0].replace(/^props="/, '').replace(/"$/, '')

    // Decode HTML entities
    const decoded = propsString
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')

    try {
      const propsObj = JSON.parse(decoded)

      // The variants are in a nested structure
      // Look for the variants array
      if (propsObj.variants) {
        return propsObj.variants
      }

      // Sometimes it's in a different structure, search recursively
      function findVariants(obj: any): any {
        if (Array.isArray(obj)) {
          for (const item of obj) {
            if (item && typeof item === 'object') {
              if (item[1] && Array.isArray(item[1])) {
                // Check if this looks like variants data
                const firstItem = item[1][0]
                if (firstItem && firstItem[1] && firstItem[1].id && firstItem[1].days) {
                  // Found it! Extract the variant objects
                  return item[1].map((v: any) => v[1])
                }
              }
              const found = findVariants(item)
              if (found) return found
            }
          }
        } else if (obj && typeof obj === 'object') {
          for (const key in obj) {
            const found = findVariants(obj[key])
            if (found) return found
          }
        }
        return null
      }

      const foundVariants = findVariants(propsObj)
      return foundVariants
    } catch (e) {
      console.error('Failed to parse props:', e)
      return null
    }
  })

  if (!variants) {
    console.log('❌ Could not find variant data in page')
    await browser.close()
    return
  }

  console.log(`✅ Found ${variants.length} variants!\n`)
  console.log('=' + '='.repeat(60))

  // Filter to only show variants we care about (1, 3, 5, 7, 10, 14, 15, 20, 30, 60, 90 days)
  const targetDays = [1, 3, 5, 7, 10, 14, 15, 20, 30, 60, 90]
  const filteredVariants = variants.filter((v: Variant) => {
    const days = parseInt(v.days)
    return targetDays.includes(days)
  })

  console.log(`\n📊 Filtered to ${filteredVariants.length} target variants:\n`)

  for (const variant of filteredVariants) {
    const usdPrice = variant.prices.find((p: VariantPrice) => p.currency === 'USD')
    console.log(`${variant.days} days: $${usdPrice?.amount || 'N/A'} USD (ID: ${variant.id})`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n💾 Full variant data (first 5 for inspection):\n')

  for (let i = 0; i < Math.min(5, filteredVariants.length); i++) {
    const variant = filteredVariants[i]
    console.log(`\nVariant ${i + 1}:`)
    console.log(JSON.stringify(variant, null, 2))
  }

  console.log('\n========================================')
  console.log('Extraction Complete!')
  console.log('========================================')

  await browser.close()
}

extractVariantData().catch(console.error)
