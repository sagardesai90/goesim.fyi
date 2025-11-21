/**
 * Script to find JavaScript pricing formulas/functions in Holafly pages
 * Strategy: Search through all JavaScript code for pricing logic
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../.env') })

import puppeteer from 'puppeteer'
import { getHolaflyBrowserConfig, USER_AGENT, EXTRA_HEADERS } from '../lib/scrapers/holafly-puppeteer/launch-args'
import { buildHolaflyCountryUrl } from '../lib/scrapers/holafly-puppeteer/country-slugs'
import fs from 'fs'

async function findPricingFormula() {
  console.log('========================================')
  console.log('Holafly Pricing Formula Search')
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

  console.log('🔍 Searching for pricing functions in JavaScript...\n')

  const pricingData = await page.evaluate(() => {
    const results: any = {
      method1_variants: [],
      method2_priceFunctions: [],
      method3_pricingObjects: [],
      method4_configObjects: [],
      method5_priceArrays: [],
    }

    // METHOD 1: Look for Shopify variants array
    const windowObj = window as any
    if (windowObj.product?.variants) {
      results.method1_variants = windowObj.product.variants
    }
    if (windowObj.variants) {
      results.method1_variants = windowObj.variants
    }
    if (windowObj.productVariants) {
      results.method1_variants = windowObj.productVariants
    }

    // METHOD 2: Search all JavaScript for price-related functions
    const scripts = Array.from(document.querySelectorAll('script'))
    const jsContent: string[] = []

    for (const script of scripts) {
      const content = script.textContent || ''
      if (content.length > 0) {
        jsContent.push(content)
      }
    }

    // Combine all JS
    const allJs = jsContent.join('\n\n')

    // Search for function definitions with price-related names
    const functionPatterns = [
      /function\s+(\w*price\w*)\s*\([^)]*\)\s*\{[^}]{0,500}\}/gi,
      /function\s+(\w*calculate\w*)\s*\([^)]*\)\s*\{[^}]{0,500}\}/gi,
      /function\s+(\w*variant\w*)\s*\([^)]*\)\s*\{[^}]{0,500}\}/gi,
      /const\s+(\w*price\w*)\s*=\s*\([^)]*\)\s*=>\s*\{[^}]{0,500}\}/gi,
      /(\w*Price\w*)\s*:\s*function\s*\([^)]*\)\s*\{[^}]{0,500}\}/gi,
    ]

    for (const pattern of functionPatterns) {
      const matches = allJs.match(pattern)
      if (matches) {
        results.method2_priceFunctions.push(...matches.slice(0, 5))
      }
    }

    // METHOD 3: Look for objects with price keys
    // Pattern: {..., price: 3.9, ...} or {..., "5": 14.9, ...}
    const priceObjectPatterns = [
      /\{[^{}]{0,200}["']?price["']?\s*:\s*[\d.]+[^{}]{0,200}\}/gi,
      /\{[^{}]{0,200}["']?cost["']?\s*:\s*[\d.]+[^{}]{0,200}\}/gi,
      /\{[^{}]{0,200}\d+\s*:\s*[\d.]+[^{}]{0,200}\}/gi, // {1: 3.9, 3: 9.9}
    ]

    for (const pattern of priceObjectPatterns) {
      const matches = allJs.match(pattern)
      if (matches) {
        results.method3_pricingObjects.push(...matches.slice(0, 10))
      }
    }

    // METHOD 4: Look for config/data objects that might contain pricing
    const configPatterns = [
      /(?:var|let|const)\s+(\w*config\w*)\s*=\s*\{[\s\S]{0,1000}\}/gi,
      /(?:var|let|const)\s+(\w*data\w*)\s*=\s*\{[\s\S]{0,500}\}/gi,
      /(?:var|let|const)\s+(\w*pricing\w*)\s*=\s*\{[\s\S]{0,500}\}/gi,
    ]

    for (const pattern of configPatterns) {
      const matches = allJs.match(pattern)
      if (matches) {
        // Filter to only those that contain numbers that look like prices
        const filtered = matches.filter(m => /[\d]+\.[\d]{1,2}/.test(m))
        results.method4_configObjects.push(...filtered.slice(0, 5))
      }
    }

    // METHOD 5: Look for arrays that might be price tables
    // Pattern: [3.9, 9.9, 14.9, ...] or [{days: 1, price: 3.9}, ...]
    const arrayPatterns = [
      /\[[\s\d.,]+\]/g, // Simple number arrays
      /\[\s*\{[^}]*price[^}]*\}[\s\S]{0,500}\]/gi, // Array of objects with price
    ]

    for (const pattern of arrayPatterns) {
      const matches = allJs.match(pattern)
      if (matches) {
        // Filter to arrays with price-like numbers
        const filtered = matches.filter(m => {
          const nums = m.match(/\d+\.\d{1,2}/g)
          return nums && nums.length >= 3 // At least 3 decimal numbers
        })
        results.method5_priceArrays.push(...filtered.slice(0, 10))
      }
    }

    return results
  })

  console.log('📊 PRICING FORMULA SEARCH RESULTS:\n')
  console.log('='.repeat(60))

  console.log('\n1️⃣  SHOPIFY VARIANTS:')
  if (pricingData.method1_variants.length > 0) {
    console.log(JSON.stringify(pricingData.method1_variants.slice(0, 20), null, 2))
  } else {
    console.log('No Shopify variants found in window object')
  }

  console.log('\n2️⃣  PRICE-RELATED FUNCTIONS:')
  if (pricingData.method2_priceFunctions.length > 0) {
    console.log(`Found ${pricingData.method2_priceFunctions.length} price-related functions:`)
    pricingData.method2_priceFunctions.forEach((fn: string, i: number) => {
      console.log(`\nFunction ${i + 1}:`)
      console.log(fn.substring(0, 300))
    })
  } else {
    console.log('No price-related functions found')
  }

  console.log('\n3️⃣  PRICING OBJECTS:')
  if (pricingData.method3_pricingObjects.length > 0) {
    console.log(`Found ${pricingData.method3_pricingObjects.length} pricing objects:`)
    pricingData.method3_pricingObjects.forEach((obj: string, i: number) => {
      console.log(`\nObject ${i + 1}:`)
      console.log(obj)
    })
  } else {
    console.log('No pricing objects found')
  }

  console.log('\n4️⃣  CONFIG/DATA OBJECTS WITH PRICES:')
  if (pricingData.method4_configObjects.length > 0) {
    console.log(`Found ${pricingData.method4_configObjects.length} config objects:`)
    pricingData.method4_configObjects.forEach((cfg: string, i: number) => {
      console.log(`\nConfig ${i + 1}:`)
      console.log(cfg.substring(0, 500))
    })
  } else {
    console.log('No config objects found')
  }

  console.log('\n5️⃣  PRICE ARRAYS:')
  if (pricingData.method5_priceArrays.length > 0) {
    console.log(`Found ${pricingData.method5_priceArrays.length} price arrays:`)
    pricingData.method5_priceArrays.forEach((arr: string, i: number) => {
      console.log(`\nArray ${i + 1}:`)
      console.log(arr)
    })
  } else {
    console.log('No price arrays found')
  }

  // Save full page HTML and JS for manual inspection if needed
  console.log('\n📝 Saving page source for manual inspection...')
  const html = await page.content()
  fs.writeFileSync('/Users/sagardesai/Downloads/holafly-page-source.html', html)
  console.log('✅ Saved to: /Users/sagardesai/Downloads/holafly-page-source.html')

  console.log('\n' + '='.repeat(60))

  // Now try to execute JavaScript to see if we can find pricing logic
  console.log('\n🔬 Attempting to extract pricing via JavaScript execution...\n')

  const extractedPrices = await page.evaluate(() => {
    const windowObj = window as any
    const results: any = {}

    // Try to find any pricing-related variables
    const keys = Object.keys(windowObj)
    const pricingKeys = keys.filter(k =>
      k.toLowerCase().includes('price') ||
      k.toLowerCase().includes('variant') ||
      k.toLowerCase().includes('product') ||
      k.toLowerCase().includes('esim')
    )

    for (const key of pricingKeys.slice(0, 10)) {
      try {
        const value = windowObj[key]
        if (value && typeof value === 'object') {
          results[key] = JSON.parse(JSON.stringify(value))
        } else if (typeof value !== 'function') {
          results[key] = value
        }
      } catch (e) {
        // Skip circular references
      }
    }

    return results
  })

  console.log('Window pricing-related variables:')
  console.log(JSON.stringify(extractedPrices, null, 2))

  console.log('\n========================================')
  console.log('Search Complete')
  console.log('========================================')

  await browser.close()
}

findPricingFormula().catch(console.error)
