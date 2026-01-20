import { test, expect } from '@playwright/test';

test('WEG Employee Flow - Login and Request Management', async ({ page }) => {
  // Increase timeout for this test as it involves multiple steps and navigation
  test.setTimeout(90000);

  // Generate unique user to avoid conflicts
  const timestamp = Date.now();
  const email = `weg.employee.${timestamp}@weg.net`;
  const password = 'Password123!';
  const companyName = `WEG Solar ${timestamp}`;

  console.log(`Starting test with user: ${email}`);

  // 1. Navigate to Register Page (Simulating first access)
  await page.goto('http://localhost:3000/register', { waitUntil: 'domcontentloaded' });

  // Ensure we are on the User Registration tab
  await expect(page.getByRole('heading', { name: 'Criar Conta' })).toBeVisible({ timeout: 30000 });

  // Fill User Registration Form
  await page.locator('#name').fill('Funcionario WEG');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#confirmPassword').fill(password);

  // Accept Terms (Checkbox)
  // Finding the checkbox by its label or ID
  await page.locator('#terms').check();

  // Submit User Registration
  await page.getByRole('button', { name: 'Criar conta' }).click();

  // Wait for navigation to home or dashboard (Login successful)
  // Assuming the app redirects to home '/' after registration
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  
  // 2. Navigate to Profile/Dashboard
  await page.goto('http://localhost:3000/profile');

  // 3. Locate "Cadastrar Empresa" button (Solicitação de gerenciamento)
  const registerCompanyBtn = page.getByRole('button', { name: 'Cadastrar Empresa' });
  await expect(registerCompanyBtn).toBeVisible();
  await registerCompanyBtn.click();

  // 4. Fill Company Registration Form
  // Expecting to see "Cadastro de Empresa" form
  await expect(page.getByRole('heading', { name: 'Cadastro de Empresa' })).toBeVisible();

  await page.getByLabel('Nome da Empresa').fill(companyName);
  await page.getByLabel('Descrição').fill('Empresa líder global em equipamentos eletroeletrônicos, atuando principalmente no setor de bens de capital.');
  await page.getByLabel('Email Público').fill(`contato.${timestamp}@weg.net`);
  await page.getByLabel('Telefone').fill('(47) 3276-4000');
  
  // CNPJ (Using WEG's real CNPJ but slightly modified to ensure uniqueness if validated strictly, 
  // but for frontend validation format matters more. Let's use a valid format)
  // 84.429.695/0001-11 is WEG.
  await page.getByLabel('CNPJ').fill('84.429.695/0001-11');

  await page.getByLabel('Endereço').fill('Av. Prefeito Waldemar Grubba, 3300');
  
  // Select State (SC)
  // Shadcn select trigger
  await page.locator('button[role="combobox"]').click();
  await page.getByRole('option', { name: 'SC' }).click();

  await page.getByLabel('Cidade').fill('Jaraguá do Sul');

  // Accept Terms
  await page.locator('#terms').check();

  // 5. Submit Solicitation
  await page.getByRole('button', { name: 'Cadastrar Empresa' }).click();

  // 6. Verify Success
  // Expecting a success message or redirection
  // "Cadastro realizado com sucesso" or similar toast
  await expect(page.getByText('Cadastro realizado com sucesso')).toBeVisible({ timeout: 10000 });

  console.log('Test completed successfully');
});