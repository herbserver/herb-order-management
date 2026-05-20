const { chromium } = require('playwright');

async function runTest() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

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
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login.html');
    
    // Switch to Department tab
    console.log('Switching to department tab...');
    await page.click('#loginTabDept');
    
    // Make sure we select Verify type
    console.log('Selecting verify department type...');
    await page.click('#deptTypeVerify');
    
    // Fill credentials
    console.log('Filling credentials...');
    await page.fill('#deptLoginId', 'HON-V001');
    await page.fill('#deptLoginPass', '123456');
    
    // Click Login
    console.log('Clicking login...');
    await page.click('button:has-text("Login to Panel")');
    
    // Wait for redirection to /verification
    console.log('Waiting for URL to contain /verification...');
    await page.waitForURL('**/verification**', { timeout: 10000 });
    console.log('Successfully logged in! Current URL:', page.url());
    
    // Wait for the verification page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // extra wait for data fetching
    
    // Take screenshot of Pending Address Verification page
    await page.screenshot({ path: 'scratch/verification_pending.png', fullPage: true });
    console.log('Saved pending verification page screenshot to scratch/verification_pending.png');
    
    // Click on On Hold / Unverified tab
    console.log('Clicking on On Hold / Unverified tab...');
    // Let's find the selector for the tab
    const holdTab = await page.locator('button:has-text("On Hold")');
    if (await holdTab.count() > 0) {
      await holdTab.click();
      console.log('Clicked On Hold tab');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'scratch/verification_hold.png', fullPage: true });
      console.log('Saved hold verification page screenshot to scratch/verification_hold.png');
    } else {
      console.log('Could not find On Hold tab');
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

runTest();
