const { chromium, expect } = require('playwright');
const fs = require('fs');

(async () => {
  const consoleLogs = [];
  const errors = [];
  let testResults = {};

  const credentials = [
    { email: 'felipe-admin@avaliasolar.com.br', password: 'Bolota16574014@', label: 'Admin' },
    { email: 'felipe@avaliasolar.com.br', password: 'Bolota16574014@', label: 'Regular' }
  ];

  const baseUrl = 'https://www.avaliasolar.com.br';
  let successfulCredential = null;
  const startTime = Date.now();

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  AVALIA SOLAR - COMPREHENSIVE TEST SUITE (v2)                  ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║ Base URL: ${baseUrl.padEnd(56)}║`);
  console.log(`║ Start: ${new Date().toISOString().padEnd(58)}║`);
  console.log(`║ Viewport: 1280x800 | Tracing: ON | Headless: NO              ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo'
  });

  const page = await context.newPage();

  // Capture all console events
  page.on('console', msg => {
    const entry = { type: msg.type(), text: msg.text() };
    consoleLogs.push(entry);
    const prefix = {
      'log': '📝',
      'warn': '⚠️',
      'error': '❌',
      'info': 'ℹ️',
      'verbose': '🔍'
    }[msg.type()] || '•';
    console.log(`${prefix} [${msg.type().toUpperCase()}] ${msg.text().substring(0, 100)}`);
    
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    const msg = `[PageError] ${err.message}`;
    errors.push(msg);
    console.log(`❌ ${msg}`);
  });

  page.on('response', resp => {
    if (resp.status() >= 400 && resp.status() < 500) {
      console.log(`⚠️  [${resp.status()}] ${resp.url()}`);
    }
  });

  try {
    // STEP 1: HOMEPAGE
    console.log('1️⃣  LOADING HOMEPAGE...');
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForLoadState('domcontentloaded');
    console.log(`   ✓ Loaded: ${page.url()}`);
    
    await page.screenshot({ path: 'homepage.png', fullPage: true });
    console.log(`   ✓ Screenshot saved: homepage.png`);

    // Inspect page for login button locations
    const loginElements = await page.locator('a[href="/login"], button:has-text("Login"), text=/Login/i').all();
    console.log(`   📍 Found ${loginElements.length} login-related elements\n`);

    // TRY EACH CREDENTIAL
    for (let credIdx = 0; credIdx < credentials.length; credIdx++) {
      const cred = credentials[credIdx];
      console.log(`\n2️⃣  LOGIN ATTEMPT ${credIdx + 1}/2 - ${cred.label} (${cred.email})`);
      
      // Reload homepage
      await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 90000 });
      await page.waitForTimeout(1000);

      // Click login - try multiple methods
      console.log('   Attempting to open login modal...');
      let loginClicked = false;

      // Method 1: Click link
      try {
        const loginLink = page.locator('a[href="/login"]').first();
        if (await loginLink.isVisible({ timeout: 5000 })) {
          await loginLink.click({ force: true, timeout: 10000 });
          loginClicked = true;
          console.log('   ✓ Login link clicked (method 1)');
        }
      } catch (e) {
        console.log(`   ⚠️  Method 1 failed: ${e.message}`);
      }

      // Wait for page to process
      await page.waitForTimeout(2000);

      // Check if we're on login page or modal appeared
      const currentUrl = page.url();
      console.log(`   Current URL: ${currentUrl}`);

      if (currentUrl.includes('/login')) {
        console.log('   ✓ Navigated to login page');
        
        // Screenshot login page
        await page.screenshot({ path: 'login_modal.png', fullPage: true });
        console.log('   ✓ Screenshot: login_modal.png');

        // Fill form on login page
        console.log(`   Filling credentials (${cred.email})...`);
        
        try {
          // Email field
          const emailField = page.locator('input[type="email"], input[name="email"], input[id*="email" i]').first();
          await emailField.fill(cred.email, { timeout: 10000 });
          console.log('   ✓ Email filled');
        } catch (e) {
          console.log(`   ❌ Email field error: ${e.message}`);
          continue;
        }

        try {
          // Password field
          const passwordField = page.locator('input[type="password"], input[name="password"]').first();
          await passwordField.fill(cred.password, { timeout: 10000 });
          console.log('   ✓ Password filled');
        } catch (e) {
          console.log(`   ❌ Password field error: ${e.message}`);
          continue;
        }

        // Optional: Check remember me
        try {
          const checkbox = page.locator('input[type="checkbox"]').first();
          if (await checkbox.isVisible({ timeout: 2000 })) {
            const checked = await checkbox.isChecked();
            if (!checked) {
              await checkbox.click();
              console.log('   ✓ Remember me checked');
            }
          }
        } catch (e) {
          console.log(`   ℹ️  Remember me not found (okay)`);
        }

        // Submit form
        console.log('   Submitting login form...');
        try {
          const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar")').first();
          await submitBtn.click({ force: true, timeout: 10000 });
          console.log('   ✓ Submit button clicked');
        } catch (e) {
          console.log(`   ❌ Submit error: ${e.message}`);
          continue;
        }

        // Wait for response
        await page.waitForTimeout(2000);

        // Check for error message
        const errorMsg = await page.locator('[role="alert"], .alert-error, .error-message, text=/inválidas|incorreta|erro/i').first().textContent({ timeout: 3000 }).catch(() => null);
        if (errorMsg) {
          console.log(`   ❌ Auth Error: ${errorMsg}`);
          await page.screenshot({ path: `error_login_${cred.label}.png` });
          continue;
        }

        // Wait for navigation
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
          console.log('   ✓ Navigation completed');
        } catch (e) {
          console.log(`   ⚠️  Navigation timeout: ${e.message}`);
        }

        // Check final URL
        const finalUrl = page.url();
        console.log(`   Final URL: ${finalUrl}`);

        if (finalUrl.includes('/dashboard') || finalUrl.includes('/company') || finalUrl.includes('/home')) {
          console.log(`   ✅ LOGIN SUCCESSFUL (${cred.label})`);
          successfulCredential = cred;

          // DASHBOARD VALIDATION
          console.log('\n3️⃣  VALIDATING DASHBOARD...');
          await page.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(1000);

          await page.screenshot({ path: 'dashboard.png', fullPage: true });
          console.log('   ✓ Screenshot: dashboard.png');

          // Sidebar items
          const sidebarItems = [
            'Home', 'Analytics', 'Avaliações', 'Dados de interação',
            'Edição de produto', 'Perguntas', 'Integrações', 'Selos'
          ];
          
          let sidebarCount = 0;
          console.log('   Checking sidebar elements...');
          for (const item of sidebarItems) {
            try {
              const elem = page.locator(`text=${item}`).first();
              const visible = await elem.isVisible({ timeout: 3000 }).catch(() => false);
              if (visible) {
                console.log(`     ✓ ${item}`);
                sidebarCount++;
              } else {
                console.log(`     ⚠️  ${item} (not visible)`);
              }
            } catch (e) {
              console.log(`     ⚠️  ${item} (error)`);
            }
          }
          testResults.sidebar = `${sidebarCount}/8`;

          // User info
          try {
            const user = page.locator('text=/Felipe|Henrique/i').first();
            const visible = await user.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(`   ${visible ? '✓' : '⚠️'} User info visible: ${visible}`);
            testResults.userInfo = visible;
          } catch (e) {
            console.log(`   ⚠️  User info check failed`);
          }

          // Banner
          try {
            const banner = page.locator('text=/Arranjar|avaliações|Começar/i').first();
            const visible = await banner.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(`   ${visible ? '✓' : '⚠️'} Banner visible: ${visible}`);
            testResults.banner = visible;
          } catch (e) {
            console.log(`   ⚠️  Banner check failed`);
          }

          // Companies page
          console.log('\n4️⃣  TESTING COMPANIES PAGE...');
          await page.goto(`${baseUrl}/companies`, { waitUntil: 'networkidle', timeout: 90000 });
          await page.screenshot({ path: 'companies.png', fullPage: true });
          console.log('   ✓ Screenshot: companies.png');

          // Company detail
          console.log('\n5️⃣  TESTING COMPANY DETAIL...');
          await page.goto(`${baseUrl}/companies/genial-solar`, { waitUntil: 'networkidle', timeout: 90000 });
          await page.screenshot({ path: 'company_detail.png', fullPage: true });
          console.log('   ✓ Screenshot: company_detail.png');

          // Register page
          console.log('\n6️⃣  TESTING REGISTER PAGE...');
          await page.goto(`${baseUrl}/register`, { waitUntil: 'networkidle', timeout: 90000 });
          await page.screenshot({ path: 'register_modal.png', fullPage: true });
          console.log('   ✓ Screenshot: register_modal.png');

          // Responsive
          console.log('\n7️⃣  TESTING RESPONSIVENESS...');
          await page.setViewportSize({ width: 375, height: 667 });
          console.log('   ✓ Mobile viewport (375x667)');
          await page.setViewportSize({ width: 1280, height: 800 });
          console.log('   ✓ Desktop viewport (1280x800)');

          break; // Success, exit loop
        } else {
          console.log(`   ❌ Login failed - still on /login`);
          await page.screenshot({ path: `error_login_${cred.label}.png` });
        }
      }
    }

  } catch (err) {
    console.error(`\n❌ Test Error: ${err.message}`);
    await page.screenshot({ path: 'error_general.png', fullPage: true }).catch(() => {});
  }

  // FINAL REPORT
  const duration = Date.now() - startTime;
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY REPORT                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (successfulCredential) {
    console.log(`✅ LOGIN SUCCESSFUL\n`);
    console.log(`   Credential: ${successfulCredential.label}`);
    console.log(`   Email: ${successfulCredential.email}`);
    console.log(`   Final URL: ${page.url()}`);
    console.log(`   Dashboard: ${page.url().includes('/dashboard') ? '✅' : '⚠️'}`);
  } else {
    console.log(`❌ LOGIN FAILED\n`);
    console.log(`   Both credentials rejected`);
    console.log(`   Final URL: ${page.url()}`);
  }

  console.log(`\n📸 Screenshots (${6} captured):`);
  const shots = ['homepage.png', 'login_modal.png', 'dashboard.png', 'companies.png', 'company_detail.png', 'register_modal.png'];
  for (const shot of shots) {
    if (fs.existsSync(shot)) {
      const size = (fs.statSync(shot).size / 1024).toFixed(1);
      console.log(`   ✓ ${shot.padEnd(25)} (${size} KB)`);
    }
  }

  console.log(`\n🔍 Console Events: ${consoleLogs.length} messages`);
  const errorCount = errors.length;
  console.log(`   Errors: ${errorCount}`);
  if (errorCount > 0) {
    errors.slice(0, 3).forEach(e => console.log(`     - ${e.substring(0, 70)}`));
    if (errorCount > 3) console.log(`     ... and ${errorCount - 3} more`);
  }

  console.log(`\n⚙️  Validation Results:`);
  Object.entries(testResults).forEach(([key, val]) => {
    console.log(`   ${key}: ${val}`);
  });

  console.log(`\n⏱️  Performance:`);
  console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
  console.log(`   Success Rate: ${successfulCredential ? '100%' : '0%'}`);

  console.log(`\n📝 End: ${new Date().toISOString()}`);
  console.log('════════════════════════════════════════════════════════════════\n');

  await context.close();
  await browser.close();
  process.exit(successfulCredential ? 0 : 1);
})();
