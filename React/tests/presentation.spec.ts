import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const viewports = [{width:320,height:800},{width:768,height:900},{width:1024,height:900},{width:1440,height:960}];
test('four routes retain a contained layout at required viewport widths', async ({page}) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const route of ['overview','work-orders','dispatch','assistant']) {
      await page.goto(`/${route}`);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    }
  }
});

test('theme switch, skip link and app-authored shell have no serious axe violations', async ({page}) => {
  await page.setViewportSize({width:1440,height:960});
  await page.goto('/overview');
  await page.getByRole('button', {name:'Switch to dark theme'}).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.getByRole('link',{name:'Skip to content'}).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-heading')).toBeFocused();
  // Vendor Grid and the unlicensed Syncfusion banner are inspected separately in prototype evidence:
  // their generated markup cannot be corrected in application source without a configured license/theme package.
  const scan = await new AxeBuilder({page}).include('main').exclude('.e-grid').withTags(['wcag2a','wcag2aa']).analyze();
  expect(scan.violations.filter(item=>['critical','serious'].includes(item.impact ?? '')).map(item=>item.id)).toEqual([]);
  await page.screenshot({path:'../../validation/screenshots/prototype-dark-1440.png',fullPage:true});
  await page.getByRole('button',{name:'Switch to light theme'}).focus();
  await page.keyboard.press('Enter');
  await page.screenshot({path:'../../validation/screenshots/prototype-light-1440.png',fullPage:true});
});

test('narrow-screen navigation opens the accessible workspace menu', async ({page}) => {
  await page.setViewportSize({width:320,height:800});
  await page.goto('/overview');
  await page.getByRole('button',{name:'Open navigation'}).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog',{name:'Workspace navigation'})).toBeVisible();
  await page.getByRole('link',{name:'Dispatch Board',exact:true}).last().click();
  await expect(page.getByRole('heading',{name:'Dispatch board'})).toBeVisible();
  await page.screenshot({path:'../../validation/screenshots/prototype-light-320.png',fullPage:true});
});

test('workload chart renders each status column without a motion-dependent screenshot', async ({page}) => {
  await page.goto('/overview');
  await expect(page.locator('#workload-chart path[id^="workload-chart_Series_0_Point_"]')).toHaveCount(5);
  await expect(page.locator('#workload-chart_Series_0_Point_0')).toHaveAttribute('fill', 'var(--chart-series-primary)');
});

test('overview uses Syncfusion Card KPIs and a Grid for technician workload', async ({page}) => {
  await page.goto('/overview');
  await expect(page.locator('.metrics .e-card')).toHaveCount(4);
  await expect(page.getByRole('button', {name:'Open work orders: 24. View work orders'})).toBeVisible();
  await expect(page.getByText('View work orders', {exact:true})).toHaveCount(0);
  await expect(page.locator('#technician-workload-grid')).toBeVisible();
  await expect(page.locator('#technician-workload-grid .e-row')).toHaveCount(6);
});

test('KPI Syncfusion Card opens its linked work-order view with the keyboard', async ({page}) => {
  await page.goto('/overview');
  const card = page.getByRole('button', {name:'Open work orders: 24. View work orders'});
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', {name:'Work orders'})).toBeVisible();
});

test('KPI card icon aligns with the right edge of its label row', async ({page}) => {
  await page.goto('/overview');
  const card = page.locator('.metrics .e-card').first();
  const label = card.locator('.metric-label');
  const icon = card.locator('.metric-icon svg');
  const [cardBox, labelBox, iconBox] = await Promise.all([card.boundingBox(), label.boundingBox(), icon.boundingBox()]);
  expect(cardBox).not.toBeNull();
  expect(labelBox).not.toBeNull();
  expect(iconBox).not.toBeNull();
  expect((iconBox?.x ?? 0) + (iconBox?.width ?? 0)).toBeGreaterThanOrEqual((cardBox?.x ?? 0) + (cardBox?.width ?? 0) - 32);
  expect(Math.abs(((iconBox?.y ?? 0) + (iconBox?.height ?? 0) / 2) - ((labelBox?.y ?? 0) + (labelBox?.height ?? 0) / 2))).toBeLessThanOrEqual(1);
});

test('KPI Card text uses the compact left inset from the Sales CRM pattern', async ({page}) => {
  await page.goto('/overview');
  const [cardBox, valueBox] = await Promise.all([
    page.locator('.metrics .e-card').first().boundingBox(),
    page.getByTestId('metric-open').boundingBox(),
  ]);
  expect(cardBox).not.toBeNull();
  expect(valueBox).not.toBeNull();
  expect((valueBox?.x ?? Number.POSITIVE_INFINITY) - (cardBox?.x ?? 0)).toBeLessThanOrEqual(18);
});

test('Work Orders pager and textbox selection use visible semantic colors', async ({page}) => {
  await page.goto('/work-orders');
  const currentPage = page.locator('.e-pager .e-currentitem');
  await expect(currentPage).toBeVisible();
  expect(await currentPage.evaluate(element => getComputedStyle(element).color)).not.toBe('rgba(0, 0, 0, 0)');
  const selection = await page.locator('#search-orders input, #search-orders').evaluate(element => {
    const style = getComputedStyle(element, '::selection');
    return { background: style.backgroundColor, color: style.color };
  });
  expect(selection.background).not.toBe(selection.color);
});
