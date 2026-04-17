const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  // Track all console messages
  const consoleLogs = [];
  const errors = [];
  let testResults = {};

  // Test credentials in priority order
  const credentials = [
    { email: 'felipe-admin@avaliasolar.com.br', password: 'Bolota16574014@', label: 'Admin' },
    { email: 'felipe@avaliasolar.com.br', password: 'Bolota16574014@', label: 'Regular' }
  ];

  const baseUrl = process.env.BASE_URL || 'https://www.avaliasolar.com.br';
  let successfulCredential = null;

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🧪 AVALIA SOLAR - COMPREHENSIVE TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`⏰ Start: ${new Date().toISOString()}`);
  console.log(`📱 Viewport: 1280x800`);
  console.log(`🔍 Tracing: ON (debug mode)`);
  console.log('');

  const context = await chromium.launch({ 
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  }).then(browser => browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: './' },
    trace: { dir: './' }
  }));

  const page = await context.newPage();

  // Setup console capture
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    };
    consoleLogs.push(logEntry);
    console.log(`[Console ${msg.type().toUpperCase()}] ${msg.text()}`);
    
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    const errMsg = `Page Error: ${err.message}`;
    console.log(`❌ ${errMsg}`);
    errors.push(errMsg);
  });

  page.on('requestfailed', req => {
    const failMsg = `Request Failed: ${req.url()} - ${req.failure().errorText}`;
    console.log(`⚠️  ${failMsg}`);
  });

  try {
    // STEP 1: Homepage
    console.log('1️⃣  LOADING HOMEPAGE...');
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 90000 });
    console.log(`✓ Homepage loaded: ${page.url()}`);
    
    // Take homepage screenshot
    await page.screenshot({ path: 'homepage.png', fullPage: true });
    console.log('✓ Screenshot: homepage.png');

    // Test credentials in sequence
    for (const cred of credentials) {
      console.log(`\n2️⃣  TESTING LOGIN - ${cred.label} (${cred.email})`);
      
      // Click login button
      console.log('  Clicking Login button...');
      try {
        const loginBtn = page.locator('button:has-text("Login")').first();
        if (await loginBtn.isVisible()) {
          await loginBtn.click();
        } else {
          const altBtn = page.locator('text=Login').first();
          await altBtn.click();
        }
        console.log('  ✓ Login button clicked');
      } catch (e) {
        console.log(`  ⚠️  Error clicking login: ${e.message}`);
        await page.screenshot({ path: `error_login_click_${cred.label}.png` });
        continue;
      }

      // Wait for modal
      console.log('  Waiting for login modal...');
      try {
        await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
        console.log('  ✓ Modal opened');
        
        await page.screenshot({ path: 'login_modal.png', fullPage: true });
        console.log('  ✓ Screenshot: login_modal.png');
      } catch (e) {
        console.log(`  ❌ Modal timeout: ${e.message}`);
        await page.screenshot({ path: `error_modal_${cred.label}.png` });
        continue;
      }

      // Fill email
      console.log(`  Filling email: ${cred.email}`);
      try {
        const emailInput = page.locator('input[type="email"], input[placeholder*="Email" i]').first();
        await emailInput.fill(cred.email, { timeout: 10000 });
        console.log('  ✓ Email filled');
      } catch (e) {
        console.log(`  ❌ Email fill failed: ${e.message}`);
        continue;
      }

      // Fill password
      console.log('  Filling password...');
      try {
        const passwordInput = page.locator('input[type="password"], input[placeholder*="Senha" i]').first();
        await passwordInput.fill(cred.password, { timeout: 10000 });
        console.log('  ✓ Password filled');
      } catch (e) {
        console.log(`  ❌ Password fill failed: ${e.message}`);
        continue;
      }

      // Check remember me
      console.log('  Checking "Lembrar-me" checkbox...');
      try {
        const checkbox = page.locator('input[type="checkbox"]').first();
        const isChecked = await checkbox.isChecked().catch(() => false);
        if (!isChecked) {
          await checkbox.check();
          console.log('  ✓ Checkbox checked');
        }
      } catch (e) {
        console.log(`  ⚠️  Remember me error (ignored): ${e.message}`);
      }

      // Click submit
      console.log('  Submitting login form...');
      try {
        const submitBtn = page.locator('button:has-text("Entrar"), button[type="submit"]').first();
        await submitBtn.click({ force: true });
        console.log('  ✓ Submit button clicked');
      } catch (e) {
        console.log(`  ❌ Submit failed: ${e.message}`);
        continue;
      }

      // Wait for auth process
      await page.waitForTimeout(2000);

      console.log('  Waiting for modal to close or navigation...');
      let loginSuccess = false;
      
      try {
        // Try to wait for modal to close
        await page.waitForFunction(
          () => !document.querySelector('[role="dialog"]'),
          { timeout: 15000 }
        ).catch(() => {});
      } catch (e) {
        console.log(`  ℹ️  Modal close timeout (may have navigated)`);
      }

      try {
        // Try to wait for navigation
        await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
      } catch (e) {
        console.log(`  ℹ️  Navigation timeout`);
      }

      // Check final URL
      const finalUrl = page.url();
      console.log(`  Final URL: ${finalUrl}`);

      if (finalUrl.includes('/dashboard') || finalUrl.includes('/company')) {
        console.log(`  ✅ LOGIN SUCCESSFUL with ${cred.label}!`);
        loginSuccess = true;
        successfulCredential = cred;
      } else {
        console.log(`  ❌ Login failed - URL is ${finalUrl}, expected /dashboard`);
        
        // Capture error message
        try {
          const errorMsg = await page.locator('[role="alert"], .error, .alert, text=/inválidas|incorreta|erro/i').first().textContent().catch(() => 'No error message');
          console.log(`  Error message: "${errorMsg}"`);
        } catch (e) {
          console.log(`  Could not capture error message`);
        }
        
        await page.screenshot({ path: `error_login_${cred.label}.png`, fullPage: true });
        continue;
      }

      if (loginSuccess) {
        // DASHBOARD VALIDATION
        console.log('\n3️⃣  VALIDATING DASHBOARD...');
        
        await page.screenshot({ path: 'dashboard.png', fullPage: true });
        console.log('✓ Screenshot: dashboard.png');

        const sidebarItems = [
          'Home', 'Analytics', 'Avaliações', 'Dados de interação',
          'Edição de produto', 'Perguntas', 'Integrações', 'Selos Avalia Solar'
        ];

        let foundElements = 0;
        for (const item of sidebarItems) {
          try {
            const elem = page.locator(`text=${item}`).first();
            const isVisible = await elem.isVisible().catch(() => false);
            if (isVisible) {
              console.log(`  ✓ Sidebar item found: ${item}`);
              foundElements++;
            } else {
              console.log(`  ⚠️  Sidebar item not visible: ${item}`);
            }
          } catch (e) {
            console.log(`  ⚠️  Error checking ${item}`);
          }
        }
        testResults.sidebarItems = `${foundElements}/8`;

        // Check user info
        try {
          const userElement = page.locator('text=/Felipe|Henrique/i').first();
          const isVisible = await userElement.isVisible().catch(() => false);
          console.log(`  ${isVisible ? '✓' : '⚠️'} User name visible: ${isVisible}`);
          testResults.userVisible = isVisible;
        } catch (e) {
          console.log(`  ⚠️  Could not check user info`);
        }

        // Check metrics
        const metrics = ['0.00 /5', 'avaliações', 'Posicionamento'];
        let metricsFound = 0;
        for (const metric of metrics) {
          try {
            const elem = page.locator(`text=${metric}`).first();
            const isVisible = await elem.isVisible().catch(() => false);
            if (isVisible) {
              console.log(`  ✓ Metric found: ${metric}`);
              metricsFound++;
            }
          } catch (e) {
            console.log(`  ⚠️  Error checking metric: ${metric}`);
          }
        }
        testResults.metricsFound = `${metricsFound}/3`;

        // Check Reports button
        try {
          const reportsBtn = page.locator('button:has-text("Relatórios"), text=Relatórios').first();
          const isVisible = await reportsBtn.isVisible().catch(() => false);
          console.log(`  ${isVisible ? '✓' : '⚠️'} Reports button visible: ${isVisible}`);
          testResults.reportsVisible = isVisible;
        } catch (e) {
          console.log(`  ⚠️  Could not check reports button`);
        }

        // COMPANIES PAGE
        console.log('\n4️⃣  TESTING COMPANIES PAGE...');
        await page.goto(`${baseUrl}/companies`, { waitUntil: 'networkidle', timeout: 90000 });
        await page.screenshot({ path: 'companies.png', fullPage: true });
        console.log('✓ Screenshot: companies.png');
        console.log(`✓ Companies URL: ${page.url()}`);

        // COMPANY DETAIL
        console.log('\n5️⃣  TESTING COMPANY DETAIL...');
        try {
          const companyLink = page.locator('text=Genial Solar, text=genial-solar, a:has-text("Genial")').first();
          if (await companyLink.isVisible().catch(() => false)) {
            await companyLink.click();
            await page.waitForTimeout(2000);
          } else {
            await page.goto(`${baseUrl}/companies/genial-solar`, { waitUntil: 'networkidle' });
          }
          
          await page.screenshot({ path: 'company_detail.png', fullPage: true });
          console.log('✓ Screenshot: company_detail.png');
          console.log(`✓ Company detail URL: ${page.url()}`);
        } catch (e) {
          console.log(`⚠️  Company detail error: ${e.message}`);
        }

        // REGISTER PAGE
        console.log('\n6️⃣  TESTING REGISTER PAGE...');
        try {
          await page.goto(`${baseUrl}/register`, { waitUntil: 'networkidle', timeout: 90000 });
          await page.screenshot({ path: 'register_modal.png', fullPage: true });
          console.log('✓ Screenshot: register_modal.png');
          console.log(`✓ Register URL: ${page.url()}`);
        } catch (e) {
          console.log(`⚠️  Register page error: ${e.message}`);
        }

        // RESPONSIVE TEST
        console.log('\n7️⃣  TESTING RESPONSIVENESS...');
        try {
          await page.setViewportSize({ width: 375, height: 667 });
          console.log('✓ Viewport changed to mobile (375x667)');
          
          const hamburger = page.locator('button[aria-label*="menu" i], button:has-text("Menu")').first();
          if (await hamburger.isVisible().catch(() => false)) {
            console.log('✓ Hamburger menu found');
          }
          
          await page.setViewportSize({ width: 1280, height: 800 });
          console.log('✓ Viewport reset to desktop (1280x800)');
        } catch (e) {
          console.log(`⚠️  Responsive test error: ${e.message}`);
        }

        break; // Success, exit credential loop
      }
    }

  } catch (err) {
    console.error(`❌ Test error: ${err.message}`);
    await page.screenshot({ path: 'error_general.png', fullPage: true });
  }

  // FINAL REPORT
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY REPORT');
  console.log('═══════════════════════════════════════════════════════════════════');

  if (successfulCredential) {
    console.log(`\n✅ LOGIN SUCCESSFUL`);
    console.log(`   Credential: ${successfulCredential.label} (${successfulCredential.email})`);
    console.log(`   Final URL: ${page.url()}`);
    console.log(`   Dashboard accessible: ${page.url().includes('/dashboard')}`);
  } else {
    console.log(`\n❌ LOGIN FAILED`);
    console.log(`   Both credentials rejected`);
    console.log(`   Final URL: ${page.url()}`);
  }

  console.log(`\n📸 Screenshots captured:`);
  const screenshots = ['homepage.png', 'login_modal.png', 'dashboard.png', 'companies.png', 'company_detail.png', 'register_modal.png'];
  for (const screenshot of screenshots) {
    if (fs.existsSync(screenshot)) {
      const size = fs.statSync(screenshot).size;
      console.log(`   ✓ ${screenshot} (${(size/1024).toFixed(1)} KB)`);
    }
  }

  console.log(`\n🔍 Console Events (${consoleLogs.length} total):`);
  const errorLogs = consoleLogs.filter(log => log.type === 'error');
  const warningLogs = consoleLogs.filter(log => log.type === 'warning');
  
  console.log(`   Errors: ${errorLogs.length}`);
  if (errorLogs.length > 0) {
    errorLogs.slice(0, 5).forEach(log => {
      console.log(`     - ${log.text}`);
    });
    if (errorLogs.length > 5) console.log(`     ... and ${errorLogs.length - 5} more`);
  }
  
  console.log(`   Warnings: ${warningLogs.length}`);
  if (warningLogs.length > 0) {
    warningLogs.slice(0, 5).forEach(log => {
      console.log(`     - ${log.text}`);
    });
    if (warningLogs.length > 5) console.log(`     ... and ${warningLogs.length - 5} more`);
  }

  console.log(`\n⚙️  Test Results:`);
  console.log(`   ${Object.entries(testResults).map(([k, v]) => `${k}: ${v}`).join('\n   ')}`);

  console.log(`\n⏱️  End: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  await context.close();
  process.exit(successfulCredential ? 0 : 1);
})();
