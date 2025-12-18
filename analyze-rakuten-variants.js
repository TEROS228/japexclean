const puppeteer = require('puppeteer');

async function analyzeRakutenVariants() {
  const url = 'https://item.rakuten.co.jp/akuse-one/f900-909/';

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('Page loaded. Extracting JavaScript data structures...\n');

    // Extract all variant-related data from window object
    const windowData = await page.evaluate(() => {
      const result = {};

      // Check for common Next.js data
      const nextData = document.getElementById('__NEXT_DATA__');
      if (nextData) {
        try {
          result.__NEXT_DATA__ = JSON.parse(nextData.textContent);
        } catch(e) {}
      }

      // Look for specific variant/sku objects in window
      const interestingKeys = [
        '__ITEM_DATA__',
        'itemData',
        'productData',
        'variantSelectors',
        'sku',
        'skuData',
        'ratVariation',
        'RAT_VARIATION',
        'variants',
        'itemOptions'
      ];

      interestingKeys.forEach(key => {
        if (window[key] !== undefined) {
          try {
            result[key] = window[key];
          } catch(e) {
            result[key + '_error'] = 'Could not serialize';
          }
        }
      });

      // Search all window keys for variant-related data
      Object.keys(window).forEach(key => {
        const val = window[key];
        if (val && typeof val === 'object' && !val.nodeType &&
            (key.toLowerCase().includes('variant') ||
             key.toLowerCase().includes('sku') ||
             (key.toLowerCase().includes('item') && key.length < 50))) {
          try {
            result['window.' + key] = val;
          } catch(e) {}
        }
      });

      return result;
    });

    console.log('=== FOUND WINDOW DATA STRUCTURES ===');
    console.log(JSON.stringify(windowData, null, 2));
    console.log('\n');

    // Look for inline script tags with variant data
    const scriptData = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      const variantScripts = [];

      scripts.forEach(script => {
        const text = script.textContent;
        if (text && (
          text.includes('variantSelectors') ||
          text.includes('sku') && text.includes('variantId') ||
          text.includes('ratVariation') ||
          text.includes('"variants"') ||
          text.includes('selectorValues')
        )) {
          // Extract the relevant portion (first 5000 chars)
          variantScripts.push({
            snippet: text.substring(0, 5000),
            length: text.length
          });
        }
      });

      return variantScripts;
    });

    console.log('=== FOUND SCRIPT TAGS WITH VARIANT DATA ===');
    scriptData.forEach((script, i) => {
      console.log(`\nScript ${i + 1} (length: ${script.length}):`);
      console.log(script.snippet);
      console.log('\n---\n');
    });

    // Save full HTML
    const html = await page.content();
    require('fs').writeFileSync('/tmp/rakuten_akuse_one.html', html);
    console.log('Full HTML saved to /tmp/rakuten_akuse_one.html');

  } finally {
    await browser.close();
  }
}

analyzeRakutenVariants().catch(console.error);
