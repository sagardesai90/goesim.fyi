/**
 * Debug script to extract and parse Holafly variant data from embedded HTML
 * This script parses the Astro Island props format: [type, value] tuples
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../.env') })

import puppeteer from 'puppeteer'
import { getHolaflyBrowserConfig, USER_AGENT, EXTRA_HEADERS } from '../lib/scrapers/holafly-puppeteer/launch-args'
import { buildHolaflyCountryUrl } from '../lib/scrapers/holafly-puppeteer/country-slugs'
import fs from 'fs'

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
  prices: VariantPrice[]
}

/**
 * Recursively deserializes Astro's serialization format
 * Format: [0, value] = primitive, [1, data] = array/object
 */
function deserializeAstroValue(value: any): any {
  if (!Array.isArray(value)) {
    return value
  }

  const [type, data] = value

  if (type === 0) {
    // Primitive value
    return data
  } else if (type === 1) {
    // Array or object
    if (Array.isArray(data)) {
      // Check if this is an array of entries (object representation)
      if (data.length > 0 && Array.isArray(data[0]) && data[0].length === 2) {
        // This looks like object entries [[key, value], ...]
        const obj: any = {}
        for (const [key, val] of data) {
          obj[deserializeAstroValue(key)] = deserializeAstroValue(val)
        }
        return obj
      } else {
        // Regular array
        return data.map(deserializeAstroValue)
      }
    }
    return data
  }

  return value
}

async function debugExtraction() {
  console.log('========================================')
  console.log('Holafly Variant Data Debug Extraction')
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

  console.log('💾 Saving HTML to file for inspection...\n')
  const html = await page.content()
  const htmlPath = '/Users/sagardesai/Downloads/holafly-debug-html.html'
  fs.writeFileSync(htmlPath, html)
  console.log(`✅ Saved HTML to: ${htmlPath}\n`)

  console.log('🔍 Searching for variant data patterns in HTML...\n')

  // Search for props attributes containing variants
  const propsPattern = /props="([^"]+)"/g
  const matches = Array.from(html.matchAll(propsPattern))

  console.log(`Found ${matches.length} props attributes total`)

  // Find the one with variants
  let variantsPropsString: string | null = null
  let matchIndex = -1

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const propsStr = match[1]
    if (propsStr.includes('&quot;variants&quot;') || propsStr.includes('&quot;Variants&quot;')) {
      variantsPropsString = propsStr
      matchIndex = i
      console.log(`✅ Found variants in props attribute #${i + 1}`)
      console.log(`Props preview (first 200 chars): ${propsStr.substring(0, 200)}...\n`)
      break
    }
  }

  if (!variantsPropsString) {
    console.log('❌ Could not find variants in any props attribute')
    console.log('\nSearching for alternative patterns...\n')

    // Try searching for "Variants" directly
    if (html.includes('Variants')) {
      console.log('✅ Found "Variants" text in HTML')
      const variantsIndex = html.indexOf('Variants')
      console.log(`Context around "Variants": ${html.substring(variantsIndex - 100, variantsIndex + 200)}`)
    }

    // Try searching for price patterns
    const pricePattern = /&quot;amount&quot;:&quot;\d+\.\d+&quot;/g
    const priceMatches = html.match(pricePattern)
    if (priceMatches) {
      console.log(`\n✅ Found ${priceMatches.length} price amount patterns`)
      console.log('Sample prices:', priceMatches.slice(0, 5))
    }

    await browser.close()
    return
  }

  console.log('🔄 Decoding HTML entities...\n')

  // Decode HTML entities
  const decoded = variantsPropsString
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")

  console.log(`Decoded props (first 300 chars):\n${decoded.substring(0, 300)}...\n`)

  try {
    console.log('📊 Parsing JSON...\n')
    const propsObj = JSON.parse(decoded)
    console.log(`✅ Successfully parsed props JSON`)
    console.log(`Props keys: ${Object.keys(propsObj).join(', ')}\n`)

    // Look for variants
    let variantsData = null

    if (propsObj.variants) {
      console.log('✅ Found variants as direct property')
      variantsData = propsObj.variants
    } else if (propsObj.Variants) {
      console.log('✅ Found Variants (capitalized) as direct property')
      variantsData = propsObj.Variants
    } else {
      console.log('⚠️  Variants not found as direct property, searching recursively...')

      function findInObject(obj: any, path: string = 'root', depth = 0): any {
        if (depth > 10) return null

        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            const found = findInObject(obj[i], `${path}[${i}]`, depth + 1)
            if (found) {
              console.log(`Found at path: ${path}[${i}]`)
              return found
            }
          }
        } else if (obj && typeof obj === 'object') {
          if (obj.variants) {
            console.log(`Found variants at: ${path}.variants`)
            return obj.variants
          }
          if (obj.Variants) {
            console.log(`Found Variants at: ${path}.Variants`)
            return obj.Variants
          }

          for (const key in obj) {
            const found = findInObject(obj[key], `${path}.${key}`, depth + 1)
            if (found) return found
          }
        }
        return null
      }

      variantsData = findInObject(propsObj)
    }

    if (!variantsData) {
      console.log('❌ Could not find variants data in props object')
      console.log('\nFull props object structure:')
      console.log(JSON.stringify(propsObj, null, 2).substring(0, 1000))
      await browser.close()
      return
    }

    console.log(`\n✅ Found variants data!`)
    console.log(`Type: ${Array.isArray(variantsData) ? 'array' : typeof variantsData}`)
    console.log(`Raw data preview: ${JSON.stringify(variantsData).substring(0, 300)}...\n`)

    console.log('🔄 Deserializing Astro format...\n')

    // Improved deserialization that handles Astro's format correctly
    function deserialize(value: any): any {
      // Base case: not an array
      if (!Array.isArray(value)) {
        // If it's an object, recursively deserialize its values
        if (value && typeof value === 'object' && !(value instanceof Date)) {
          const result: any = {}
          for (const key in value) {
            result[key] = deserialize(value[key])
          }
          return result
        }
        return value
      }

      // Check if this is an Astro serialization tuple [type, data]
      if (value.length === 2 && (value[0] === 0 || value[0] === 1)) {
        const [type, data] = value

        if (type === 0) {
          // Primitive value - return it directly (it's already deserialized)
          return data
        } else if (type === 1) {
          // Array or object
          if (Array.isArray(data)) {
            // Check if this looks like an object (array of [key, value] pairs where key is a string)
            if (data.length > 0 && Array.isArray(data[0]) && data[0].length === 2 && typeof data[0][0] === 'string') {
              // Object format: [["key", value], ["key", value], ...]
              const obj: any = {}
              for (const [key, val] of data) {
                obj[deserialize(key)] = deserialize(val)
              }
              return obj
            } else {
              // Array format: [[0, item1], [0, item2], ...]
              return data.map(deserialize)
            }
          }
          return data
        }
      }

      // Regular array (not an Astro tuple)
      return value.map(deserialize)
    }

    const deserialized = deserialize(variantsData)

    console.log(`✅ Deserialized!`)
    console.log(`Type: ${Array.isArray(deserialized) ? 'array' : typeof deserialized}`)
    console.log(`Length: ${Array.isArray(deserialized) ? deserialized.length : 'N/A'}\n`)

    if (Array.isArray(deserialized) && deserialized.length > 0) {
      console.log('='.repeat(60))
      console.log('Sample variants (first 3):\n')

      for (let i = 0; i < Math.min(3, deserialized.length); i++) {
        console.log(`Variant ${i + 1}:`)
        console.log(JSON.stringify(deserialized[i], null, 2))
        console.log()
      }

      // Filter to target days
      const targetDays = [1, 3, 5, 7, 10, 14, 15, 20, 30, 60, 90]
      console.log('='.repeat(60))
      console.log('Target day values:\n')

      const filteredVariants: Variant[] = []
      for (const variant of deserialized) {
        if (variant && typeof variant === 'object') {
          // Fully deserialize the variant (in case nested values are still wrapped)
          const fullyDeserialized = deserialize(variant)
          const days = parseInt(fullyDeserialized.days || '0')
          if (targetDays.includes(days)) {
            filteredVariants.push(fullyDeserialized)
            const usdPrice = fullyDeserialized.prices?.find((p: any) => p.currency === 'USD')
            console.log(`${days.toString().padStart(2)} days: $${usdPrice?.amount || 'N/A'} (ID: ${fullyDeserialized.id})`)
          }
        }
      }

      console.log(`\n✅ Successfully extracted ${filteredVariants.length} target variants out of ${deserialized.length} total`)
    } else {
      console.log('Full deserialized data:')
      console.log(JSON.stringify(deserialized, null, 2))
    }

  } catch (e) {
    console.log('❌ Failed to parse or deserialize:', e)
    console.log('\nDecoded string preview:')
    console.log(decoded.substring(0, 500))
  }

  console.log('\n========================================')
  console.log('Extraction Complete!')
  console.log('========================================')

  await browser.close()
}

debugExtraction().catch(console.error)
