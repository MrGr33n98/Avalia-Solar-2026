import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';

test('preserva HTML de componentes no modo fonte durante o envio do formulário', async ({
  page,
}) => {
  const html =
    '<div class="as-banner" data-as-component="banner"><h2>Plano Founder</h2><p>Descrição</p><a class="as-btn as-btn--primary" href="/founder">Conheça</a></div>';

  await page.setContent(`
    <form>
      <div id="article_content_input">
        <div class="quill-editor"><div class="ql-editor"><p>Conteúdo convertido pelo Quill</p></div></div>
        <textarea id="article_content" name="article[content]">${html}</textarea>
      </div>
      <button type="submit">Salvar</button>
    </form>
  `);

  await page.locator('form').evaluate((form) => {
    form.addEventListener('submit', () => {
      const field = form.querySelector<HTMLTextAreaElement>('#article_content');
      if (field) field.value = '<p>Conteúdo simplificado pelo Quill</p>';
    });
  });

  await page.addScriptTag({
    path: resolve(process.cwd(), '../AB0-1-back/app/assets/javascripts/admin/article_studio.js'),
  });
  await page.evaluate(() => document.dispatchEvent(new Event('DOMContentLoaded')));

  const codeEditor = page.locator('#article_studio_code_editor');
  await expect(codeEditor).toHaveValue(html);
  await expect(page.locator('.quill-editor')).toHaveCSS('display', 'none');

  await page.locator('form').evaluate((form) => {
    form.addEventListener('submit', () => {
      const field = form.querySelector<HTMLTextAreaElement>('#article_content');
      if (field) field.value = '<p>Conteúdo alterado por outro handler</p>';
    });
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });

  const savedContent = await page.locator('form').evaluate((form) => {
    const field = form.querySelector<HTMLTextAreaElement>('#article_content');
    const submitted = new FormData(form).get('article[content]');
    if (field && typeof submitted === 'string') field.value = submitted;
    return submitted;
  });

  expect(savedContent).toBe(html);
  expect(savedContent).toContain('class="as-banner"');
  expect(savedContent).toContain('data-as-component="banner"');
  expect(savedContent).toContain('class="as-btn as-btn--primary"');
});

test('mantém o banner e o CTA legíveis sem overflow em telas mobile', async ({ page }) => {
  await page.setContent(`
    <style>body { margin: 0; }</style>
    <article class="as-article">
      <div class="as-banner" data-as-component="banner">
        <h2>Plano Founder</h2>
        <p>Apresente sua empresa com clareza para clientes em dispositivos móveis.</p>
        <a class="as-btn as-btn--primary" href="/founder">Conheça o plano</a>
      </div>
    </article>
  `);
  await page.addStyleTag({ path: resolve(process.cwd(), 'styles/article-components.css') });

  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 800 });

    const cta = page.getByRole('link', { name: 'Conheça o plano' });
    await expect(page.getByRole('heading', { name: 'Plano Founder' })).toBeVisible();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveCSS('background-image', /linear-gradient/);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
  }
});
