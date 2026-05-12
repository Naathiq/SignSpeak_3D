import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (error: any) => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
  });
  
  console.log('Navigating to /sign-kit/convert...');
  await page.goto('http://localhost:3000/sign-kit/convert', { waitUntil: 'networkidle2', timeout: 30000 });
  
  console.log('Page title:', await page.title());
  
  // Wait a bit to let models load
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('Navigating to /sign-kit/live...');
  await page.goto('http://localhost:3000/sign-kit/live', { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 5000));

  await browser.close();
  console.log('Done!');
})();
