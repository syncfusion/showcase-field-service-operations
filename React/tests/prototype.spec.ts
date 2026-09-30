import { test, expect } from '@playwright/test';

test('four-route shell and coherent assignment prototype', async ({page}) => {
  await page.goto('/overview');
  await expect(page.getByRole('heading', {name:'Operations overview'})).toBeVisible();
  await expect(page.getByTestId('metric-unassigned')).toHaveText('10');
  await page.getByRole('link', {name:'Work Orders', exact:true}).click();
  await page.getByRole('button', {name:'Assign WO-1001',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#assignment-technician')).toHaveValue('Eli Carter');
  await expect(page.getByLabel('Start time (Eastern)')).toHaveValue('09/15/2026 10:30 AM');
  await expect(page.getByLabel('End time (Eastern)')).toHaveValue('09/15/2026 11:30 AM');
  await page.getByRole('button', {name:'Save assignment',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('overlap');
  await page.getByRole('button', {name:'Use next available slot · 11:00 AM',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('link', {name:'Overview',exact:true}).click();
  await expect(page.getByTestId('metric-unassigned')).toHaveText('9');
  await page.getByRole('link', {name:'Dispatch Board',exact:true}).click();
  await expect(page.getByTestId('card-WO-1001')).toContainText('Scheduled');
  await page.getByRole('link', {name:'AI Assistant',exact:true}).click();
  await expect(page.getByText('Sample responses', {exact:true})).toBeVisible();
  await expect(page.getByRole('heading', {name:'AI assistant', level:2})).toBeVisible();
  await expect(page.getByText('Deterministic sample provider through IoC', {exact:false})).toBeVisible();
  await page.reload();
  await page.goto('/overview');
  await expect(page.getByTestId('metric-unassigned')).toHaveText('10');
});

test('Work Orders exposes full local workflow controls after prototype approval', async ({page}) => {
  await page.goto('/work-orders');
  await expect(page.getByRole('button', {name:'New work order'})).toBeVisible();
  await page.getByRole('button', {name:'Manage WO-1001'}).click();
  await expect(page.getByRole('dialog', {name:'Manage WO-1001'})).toBeVisible();
  await expect(page.getByRole('button', {name:'Cancel work order'})).toBeVisible();
});

test('an in-progress job can be completed through the validated local workflow', async ({page}) => {
  await page.goto('/work-orders');
  await page.getByLabel('Search work orders').fill('WO-1022');
  await page.getByRole('button', {name:'Manage WO-1022'}).click();
  await page.getByLabel('Completion summary').fill('Workstation connectivity verified.');
  await page.getByRole('button', {name:'Complete work'}).click();
  await expect(page.getByRole('status').first()).toContainText('WO-1022 completed');
});

test('new work order and reset sample data update the visible current session', async ({page}) => {
  await page.goto('/work-orders');
  await expect(page.getByText('APPROVAL PROTOTYPE', {exact:true})).toHaveCount(0);
  await expect(page.getByText('INTERACTIVE SAMPLE', {exact:true})).toHaveCount(0);
  await expect(page).toHaveTitle('Field Service Operations | Syncfusion Showcase');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.ico');
  await page.getByRole('button', {name:'New work order'}).click();
  await page.locator('#work-order-id').fill('WO-2002');
  await page.locator('#work-order-title').fill('Add a validated work order');
  await page.getByRole('button', {name:'Create work order'}).click();
  await expect(page.locator('.notice.success')).toContainText('WO-2002 created');
  await expect(page.getByRole('status').filter({hasText:'37 of 37 work orders'})).toBeVisible();
  await page.getByLabel('Search work orders').fill('Add a validated work order');
  await expect(page.getByText('Add a validated work order', {exact:true})).toBeVisible();
  await page.getByRole('button', {name:'Reset sample data'}).click();
  await page.getByRole('button', {name:'Reset demo'}).click();
  await expect(page.locator('.notice.success')).toContainText('Sample data restored');
  await expect(page.getByText('Add a validated work order', {exact:true})).toHaveCount(0);
});

test('dispatch Kanban enables validated card dragging while swimlane moves stay disabled', async ({page}) => {
  await page.goto('/dispatch');
  const settings = await page.locator('#dispatch-board').evaluate((element: HTMLElement) => {
    const kanban = (element as HTMLElement & {ej2_instances?: Array<{allowDragAndDrop:boolean;swimlaneSettings:{allowDragAndDrop:boolean}}>}).ej2_instances?.[0];
    return {allowDragAndDrop:kanban?.allowDragAndDrop, allowSwimlaneDragAndDrop:kanban?.swimlaneSettings.allowDragAndDrop};
  });
  expect(settings).toEqual({allowDragAndDrop:true, allowSwimlaneDragAndDrop:false});
  await expect(page.getByText('Drag a card to make a validated lifecycle change.', {exact:false})).toBeVisible();
});
