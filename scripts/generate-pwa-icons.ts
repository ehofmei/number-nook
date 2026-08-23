import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const publicDirectory = path.resolve('public');
const iconJobs = [
  { source: 'icon.svg', output: 'icon-192.png', size: 192 },
  { source: 'icon.svg', output: 'icon-512.png', size: 512 },
  { source: 'icon-maskable.svg', output: 'icon-maskable-512.png', size: 512 },
  { source: 'icon-maskable.svg', output: 'apple-touch-icon.png', size: 180 },
] as const;

const browser = await chromium.launch({ headless: true });
try {
  for (const job of iconJobs) {
    const svg = await readFile(path.join(publicDirectory, job.source), 'utf8');
    const source = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    const page = await browser.newPage({ viewport: { width: job.size, height: job.size } });
    await page.setContent(
      `<style>html,body{margin:0;width:100%;height:100%;background:transparent}img{display:block;width:100%;height:100%}</style><img alt="" src="${source}">`,
    );
    await page.locator('img').screenshot({
      path: path.join(publicDirectory, job.output),
      omitBackground: true,
    });
    await page.close();
    console.log(`Generated ${job.output} (${job.size}×${job.size})`);
  }
} finally {
  await browser.close();
}
