import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.', // Look for tests in the same directory as this config
  // We do NOT define webServer here because the bash script manages it.
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Mobile',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],
});
