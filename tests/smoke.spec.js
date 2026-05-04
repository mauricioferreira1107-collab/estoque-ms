// @ts-check
import { test, expect } from '@playwright/test';

async function login(page) {
    await page.goto('/');
    await page.getByLabel('Usuário').fill('admin');
    await page.getByLabel('Senha').fill('ms2024');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 2 })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        try { localStorage.clear(); } catch { /* ignore */ }
    });
});

test('login funciona com credenciais válidas', async ({ page }) => {
    await login(page);
});

test('login rejeita credenciais inválidas', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Usuário').fill('admin');
    await page.getByLabel('Senha').fill('errado');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page.getByText('Usuário ou senha incorretos')).toBeVisible();
});

test('navega entre páginas e mostra estoque', async ({ page }) => {
    await login(page);
    await page.locator('aside button[data-page="estoque"]').click();
    await expect(page.getByRole('heading', { name: 'Estoque Geral' })).toBeVisible();
    await expect(page.locator('#estoqueGrid > div').first()).toBeVisible();
});

test('cadastrar material e nome com HTML é escapado (anti-XSS)', async ({ page }) => {
    await login(page);
    await page.locator('aside button[data-page="cadastros"]').click();
    const payload = '<img src=x onerror="window.__xss=1">';
    await page.locator('#novoMaterialNome').fill(payload);
    await page.locator('#novoMaterialEstoque').fill('5');
    await page.locator('#novoMaterialMinimo').fill('1');
    await page.getByRole('button', { name: 'Cadastrar Material' }).click();

    await page.locator('aside button[data-page="estoque"]').click();
    await page.locator('#searchEstoque').fill(payload);
    // Aguarda debounce
    await page.waitForTimeout(300);
    await expect(page.locator('#estoqueGrid')).toContainText(payload);
    const xssTriggered = await page.evaluate(() => /** @type {any} */ (window).__xss);
    expect(xssTriggered).toBeUndefined();
});

test('registrar entrada incrementa estoque', async ({ page }) => {
    await login(page);
    await page.locator('aside button[data-page="entrada"]').click();
    await page.locator('#entradaMaterial').selectOption({ index: 1 });
    await page.locator('#entradaQtd').fill('3');
    await page.getByRole('button', { name: 'Confirmar Entrada' }).click();
    await expect(page.getByText('Entrada registrada!')).toBeVisible();
    await expect(page.locator('#historicoEntradas')).toContainText('+3');
});

test('saída bloqueia quantidade maior que disponível', async ({ page }) => {
    await login(page);
    await page.locator('aside button[data-page="saida"]').click();
    await page.locator('#saidaMaterial').selectOption({ index: 1 });
    await page.locator('#saidaQtd').fill('999999');
    await page.locator('#saidaObra').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Confirmar Saída' }).click();
    await expect(page.getByText(/insuficiente/i)).toBeVisible();
});

test('getStatus não marca CRÍTICO itens com mínimo zero', async ({ page }) => {
    await login(page);
    const counts = await page.evaluate(() => {
        // @ts-ignore
        const e = JSON.parse(localStorage.getItem('ms_estoque'));
        const crit = e.filter((i) => i.minimo > 0 && i.estoque_atual <= 0);
        const allMinZeroCrit = e.filter((i) => i.minimo === 0).every((i) => true);
        return { critByPolicy: crit.length, allMinZeroCrit };
    });
    const dashCrit = await page.locator('#statsGrid div:nth-child(2) p:nth-child(2)').textContent();
    expect(parseInt(dashCrit ?? '0', 10)).toBe(counts.critByPolicy);
});

test('manifest.json é servido e tem ícone válido', async ({ request }) => {
    const resp = await request.get('/manifest.json');
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(data.icons.length).toBeGreaterThan(0);
    const iconResp = await request.get('/' + data.icons[0].src);
    expect(iconResp.status()).toBe(200);
});

test('export gera download de JSON', async ({ page }) => {
    await login(page);
    await page.locator('aside button[data-page="cadastros"]').click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /exportar/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/ms-estoque-backup-.*\.json$/);
});
