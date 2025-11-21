/**
 * Script to extract embedded pricing data from Holafly pages
 * Strategy: Look for JavaScript variables, JSON data, or Shopify product info
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../.env') })

import puppeteer from 'puppeteer'
import { getHolaflyBrowserConfig, USER_AGENT, EXTRA_HEADERS } from '../lib/scrapers/holafly-puppeteer/launch-args'
import { buildHolaflyCountryUrl } from '../lib/scrapers/holafly-puppeteer/country-slugs'

async function extractEmbeddedData() {
  console.log('========================================')
  console.log('Holafly Embedded Data Extraction')
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

  console.log('🔍 Extracting embedded data from page...\n')

  // Extract all possible data sources
  const embeddedData = await page.evaluate(() => {
    const results: any = {
      method1_windowVars: {},
      method2_scriptTags: [],
      method3_dataAttributes: [],
      method4_shopifyProduct: null,
      method5_metaTags: [],
    }

    // METHOD 1: Check window object for common variable names
    const windowObj = window as any
    const commonVarNames = [
      'shopifyProduct',
      'product',
      'productData',
      'pricing',
      'prices',
      'variants',
      'productVariants',
      'esimData',
      'planData',
      'plans',
      '__INITIAL_STATE__',
      '__NEXT_DATA__',
      '__NUXT__',
      'dataLayer',
    ]

    for (const varName of commonVarNames) {
      if (windowObj[varName]) {
        results.method1_windowVars[varName] = windowObj[varName]
      }
    }

    // METHOD 2: Search script tags for JSON data
    const scripts = Array.from(document.querySelectorAll('script'))
    for (const script of scripts) {
      const content = script.textContent || ''

      // Look for JSON structures
      if (content.includes('price') || content.includes('variant') || content.includes('product')) {
        // Try to find JSON objects
        const jsonMatches = content.match(/\{[^{}]*"price"[^{}]*\}/g) ||
                          content.match(/\{[^{}]*"variant"[^{}]*\}/g)

        if (jsonMatches && jsonMatches.length > 0) {
          results.method2_scriptTags.push({
            type: script.type || 'text/javascript',
            id: script.id,
            jsonSamples: jsonMatches.slice(0, 3).map(j => j.substring(0, 200)),
          })
        }

        // Look for variable assignments
        const varMatches = content.match(/(var|let|const)\s+(\w+)\s*=\s*(\{[\s\S]*?\});/g)
        if (varMatches && varMatches.length > 0) {
          results.method2_scriptTags.push({
            type: 'variable_assignment',
            samples: varMatches.slice(0, 3).map(m => m.substring(0, 200)),
          })
        }
      }

      // Special case: application/json or application/ld+json
      if (script.type === 'application/json' || script.type === 'application/ld+json') {
        try {
          const parsed = JSON.parse(content)
          results.method2_scriptTags.push({
            type: script.type,
            id: script.id,
            data: parsed,
          })
        } catch (e) {
          // Not valid JSON
        }
      }
    }

    // METHOD 3: Check for data attributes with pricing
    const elementsWithData = Array.from(document.querySelectorAll('[data-product], [data-variant], [data-price], [data-pricing]'))
    for (const el of elementsWithData) {
      const attrs: Record<string, string> = {}
      for (const attr of el.attributes) {
        if (attr.name.startsWith('data-')) {
          attrs[attr.name] = attr.value
        }
      }
      results.method3_dataAttributes.push(attrs)
    }

    // METHOD 4: Try to access Shopify product object (common in Shopify themes)
    if (windowObj.ShopifyAnalytics) {
      results.method4_shopifyProduct = {
        analytics: windowObj.ShopifyAnalytics,
        meta: windowObj.meta || null,
      }
    }

    // METHOD 5: Check meta tags for product info
    const metaTags = Array.from(document.querySelectorAll('meta[property^="og:"], meta[property^="product:"], meta[name^="shopify"]'))
    for (const meta of metaTags) {
      results.method5_metaTags.push({
        property: meta.getAttribute('property') || meta.getAttribute('name'),
        content: meta.getAttribute('content'),
      })
    }

    return results
  })

  console.log('📊 EXTRACTION RESULTS:\n')
  console.log('='.repeat(60))

  console.log('\n1️⃣  WINDOW VARIABLES:')
  console.log(JSON.stringify(embeddedData.method1_windowVars, null, 2))

  console.log('\n2️⃣  SCRIPT TAGS WITH PRICING DATA:')
  console.log(`Found ${embeddedData.method2_scriptTags.length} script tags with potential pricing data`)
  for (let i = 0; i < Math.min(3, embeddedData.method2_scriptTags.length); i++) {
    console.log(`\nScript ${i + 1}:`)
    console.log(JSON.stringify(embeddedData.method2_scriptTags[i], null, 2))
  }

  console.log('\n3️⃣  DATA ATTRIBUTES:')
  console.log(`Found ${embeddedData.method3_dataAttributes.length} elements with data attributes`)
  console.log(JSON.stringify(embeddedData.method3_dataAttributes.slice(0, 5), null, 2))

  console.log('\n4️⃣  SHOPIFY PRODUCT DATA:')
  console.log(JSON.stringify(embeddedData.method4_shopifyProduct, null, 2))

  console.log('\n5️⃣  META TAGS:')
  console.log(JSON.stringify(embeddedData.method5_metaTags, null, 2))

  console.log('\n' + '='.repeat(60))
  console.log('\n🔍 Now trying Shopify Product API...\n')

  // Try Shopify product endpoint
  try {
    // First, try to find the product handle from the page
    const productHandle = await page.evaluate(() => {
      // Common places to find product handle
      const url = window.location.pathname
      const match = url.match(/\/products\/([^\/]+)/) || url.match(/esim-([^\/]+)/)
      return match ? match[1] : null
    })

    console.log(`Product handle from URL: ${productHandle || 'not found'}`)

    if (productHandle) {
      const shopifyUrls = [
        `https://holafly-esim.myshopify.com/products/${productHandle}.json`,
        `https://esim.holafly.com/products/${productHandle}.json`,
        `https://holafly-esim.myshopify.com/products/esim-${productHandle}.json`,
      ]

      for (const url of shopifyUrls) {
        console.log(`\n🌐 Trying: ${url}`)
        try {
          const response = await page.goto(url, { timeout: 10000 })
          if (response && response.ok()) {
            const json = await response.json()
            console.log('\n✅ SUCCESS! Shopify Product API Response:')
            console.log(JSON.stringify(json, null, 2))
            break
          }
        } catch (e) {
          console.log(`❌ Failed: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
    }

    // Also try to fetch from current page context
    console.log('\n🌐 Trying to fetch product JSON from current page...')
    const productJson = await page.evaluate(async () => {
      try {
        // Try fetching with relative path
        const response = await fetch(window.location.pathname + '.json')
        if (response.ok) {
          return await response.json()
        }
      } catch (e) {
        return null
      }
      return null
    })

    if (productJson) {
      console.log('\n✅ SUCCESS! Product JSON from current page:')
      console.log(JSON.stringify(productJson, null, 2))
    } else {
      console.log('❌ Could not fetch product JSON from current page')
    }

  } catch (error) {
    console.log(`\n❌ Shopify API extraction failed: ${error}`)
  }

  console.log('\n========================================')
  console.log('Extraction Complete')
  console.log('========================================')

  await browser.close()
}

extractEmbeddedData().catch(console.error)
