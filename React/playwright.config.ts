import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', fullyParallel: false, workers: 1, use: { baseURL: 'http://127.0.0.1:5173', browserName: 'chromium', channel: 'chrome', headless: true, timezoneId: 'America/New_York' }, webServer: { command: 'npm run dev', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI }, reporter: 'list' });

