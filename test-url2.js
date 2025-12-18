const puppeteer = require('puppeteer');

async function test() {
  const url = 'https://item.rakuten.co.jp/jiggybox/c-jbts-b2317/';
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const info = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      return {
        hasSkuArea: !!document.querySelector('[irc="SkuSelectionArea"], .display-sku-area'),
        hasSizeText: bodyText.includes('サイズ') || bodyText.includes('SIZE'),
        hasColorText: bodyText.includes('カラー') || bodyText.includes('COLOR'),
        skuButtons: document.querySelectorAll('[class*="sku-button"]').length,
        allButtons: document.querySelectorAll('button').length,
        selects: Array.from(document.querySelectorAll('select')).map(s => ({
          name: s.name,
          id: s.id,
          optionsCount: s.options.length
        })),
        // Ищем любые упоминания размеров
        sizeMatches: (bodyText.match(/サイズ|SIZE|Size/gi) || []).slice(0, 5),
        colorMatches: (bodyText.match(/カラー|COLOR|Color/gi) || []).slice(0, 5)
      };
    });

    console.log(JSON.stringify(info, null, 2));

    // Сохраним HTML
    const html = await page.content();
    require('fs').writeFileSync('/tmp/rakuten2.html', html);
    console.log('\nHTML saved to /tmp/rakuten2.html');

  } finally {
    await browser.close();
  }
}

test().catch(console.error);
