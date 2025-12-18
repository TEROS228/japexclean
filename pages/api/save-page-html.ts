// pages/api/save-page-html.ts
// Сохраняет полный HTML страницы после загрузки JS
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const targetUrl = req.query.url as string;

  if (!targetUrl) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let browser: any = null;
  
  try {
    const puppeteer = await import('puppeteer');
    
    browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    console.log(`Loading: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Ждем загрузки
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Получаем полный HTML после выполнения JS
    const fullHTML = await page.content();
    
    await browser.close();
    
    // Возвращаем HTML как текст
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(fullHTML);

  } catch (error) {
    if (browser) await browser.close();
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}