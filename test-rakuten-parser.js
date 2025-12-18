const puppeteer = require('puppeteer');

async function testRakutenParser() {
  const url = 'https://item.rakuten.co.jp/styleblockmen/sb-sa33414-sale/';

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('Page loaded, searching for variants...\n');

    // Извлечь данные вариантов из страницы
    const variants = await page.evaluate(() => {
      const results = [];

      // Метод 1: Поиск window.ratVariation
      if (typeof window !== 'undefined' && window.ratVariation) {
        results.push({
          method: 'window.ratVariation',
          data: window.ratVariation
        });
      }

      // Метод 2: Поиск в __NEXT_DATA__
      const nextData = document.getElementById('__NEXT_DATA__');
      if (nextData) {
        try {
          const data = JSON.parse(nextData.textContent);
          results.push({
            method: '__NEXT_DATA__',
            data: data
          });
        } catch (e) {
          results.push({
            method: '__NEXT_DATA__ (parse error)',
            error: e.message
          });
        }
      }

      // Метод 3: Поиск всех глобальных переменных с вариантами
      const globalVars = [];
      try {
        for (const key of Object.keys(window)) {
          if (key.toLowerCase().includes('variant') ||
              key.toLowerCase().includes('product') ||
              key.toLowerCase().includes('item') ||
              key.toLowerCase().includes('rat')) {
            const val = window[key];
            if (val && typeof val === 'object' && !val.nodeType) {
              globalVars.push({ key, value: val });
            }
          }
        }
      } catch (e) {}

      if (globalVars.length > 0) {
        results.push({
          method: 'global variables',
          data: globalVars
        });
      }

      // Метод 4: Поиск select/radio для размеров и цветов
      const selects = Array.from(document.querySelectorAll('select'));
      const selectData = selects.map(s => ({
        name: s.name,
        id: s.id,
        options: Array.from(s.options).map(o => ({
          value: o.value,
          text: o.text.trim()
        })).filter(o => o.text && o.text.length > 0)
      })).filter(s => s.options.length > 0);

      if (selectData.length > 0) {
        results.push({
          method: 'select elements',
          data: selectData
        });
      }

      // Метод 5: Поиск radio buttons
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      const radioGroups = {};
      radios.forEach(r => {
        if (!radioGroups[r.name]) radioGroups[r.name] = [];
        const label = document.querySelector(`label[for="${r.id}"]`);
        radioGroups[r.name].push({
          value: r.value,
          label: label?.textContent?.trim() || r.value,
          checked: r.checked
        });
      });

      if (Object.keys(radioGroups).length > 0) {
        results.push({
          method: 'radio buttons',
          data: radioGroups
        });
      }

      return results;
    });

    console.log('Results:');
    console.log(JSON.stringify(variants, null, 2));

    // Дополнительный поиск: текст на странице
    console.log('\n=== Searching for size/color text on page ===');
    const textSearch = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      const sizeMatches = bodyText.match(/(サイズ|SIZE|Size)[：:]?\s*([^\n]{0,100})/gi);
      const colorMatches = bodyText.match(/(カラー|COLOR|Color)[：:]?\s*([^\n]{0,100})/gi);

      // Поиск кнопок с текстом размеров/цветов
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], [class*="button"]'));
      const sizeButtons = buttons.filter(b =>
        b.textContent && (b.textContent.match(/^(S|M|L|XL|LL|3L|FREE)$/i) || b.textContent.match(/^\d+cm$/))
      ).map(b => ({
        text: b.textContent.trim(),
        className: b.className,
        disabled: b.disabled || b.getAttribute('disabled') || b.classList.contains('disabled')
      }));

      const colorButtons = buttons.filter(b =>
        b.textContent && b.textContent.match(/(ブラック|ホワイト|レッド|ブルー|グレー|ベージュ|グリーン|イエロー|ピンク|ネイビー|black|white|red|blue|gray|grey|beige|green|yellow|pink|navy)/i)
      ).map(b => ({
        text: b.textContent.trim(),
        className: b.className,
        disabled: b.disabled || b.getAttribute('disabled') || b.classList.contains('disabled')
      }));

      return {
        sizeMatches: sizeMatches ? sizeMatches.slice(0, 5) : [],
        colorMatches: colorMatches ? colorMatches.slice(0, 5) : [],
        sizeButtons,
        colorButtons
      };
    });

    console.log('Size mentions:', textSearch.sizeMatches);
    console.log('Color mentions:', textSearch.colorMatches);
    console.log('Size buttons found:', textSearch.sizeButtons.length);
    console.log('Color buttons found:', textSearch.colorButtons.length);

    if (textSearch.sizeButtons.length > 0) {
      console.log('Size buttons:', JSON.stringify(textSearch.sizeButtons, null, 2));
    }
    if (textSearch.colorButtons.length > 0) {
      console.log('Color buttons:', JSON.stringify(textSearch.colorButtons, null, 2));
    }

    // Всегда сохраняем HTML для анализа
    console.log('\nSaving page HTML for analysis...');
    const html = await page.content();
    require('fs').writeFileSync('/tmp/rakuten_debug.html', html);
    console.log('HTML saved to /tmp/rakuten_debug.html');

  } finally {
    await browser.close();
  }
}

testRakutenParser().catch(console.error);
