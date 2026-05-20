const { chromium } = require('playwright');

async function runTest() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console events
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`BROWSER ERROR: ${msg.text()}`);
    } else {
      console.log(`BROWSER LOG: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`BROWSER PAGEERROR: ${err.toString()}`);
  });

  try {
    console.log('Navigating to http://localhost:3000/login.html...');
    await page.goto('http://localhost:3000/login.html');
    console.log('Title:', await page.title());

    // Take screenshot of login page
    await page.screenshot({ path: 'scratch/login.png' });
    console.log('Screenshot of login page saved to scratch/login.png');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

runTest();
