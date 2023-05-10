const puppeteer = require('puppeteer-core');
const fs = require('fs');
const penthouse = require('penthouse');
const fetch = require('node-fetch');
const DELAY_MS = 10000;

async function generateCriticalCss(url, outputFile) {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.setViewport({ width: 1920, height: 1080 });
  await page.waitForTimeout(DELAY_MS);

  const stylesheets = await page.evaluate(() => {
    const sheetNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    return sheetNodes.map(node => node.href);
  });

  const cssContents = await Promise.all(stylesheets.map(async sheet => {
    const response = await fetch(sheet);
    return response.text();
  }));

  const css = cssContents.join('\n');

  const html = await page.content();
  fs.writeFileSync(`${outputFile}.html`, html);

  await browser.close();

  const penthouseOptions = {
    url: url,
    cssString: css,
    width: 1920,
    height: 1080,
    timeout: 120000,
    strict: false,
    maxEmbeddedBase64Length: 1000,
    renderWaitTime: DELAY_MS,
    blockJSRequests: false,
  };

  await penthouse(penthouseOptions, (err, criticalCss) => {
    if (err) {
      console.log(`Error generating critical CSS for ${url}: ${err}`);
      return;
    }

    if (criticalCss.trim().length === 0) {
      console.log(`No critical CSS found for ${url}`);
      return;
    }

    fs.writeFileSync(`${outputFile}.css`, criticalCss);
    console.log(`Critical CSS generated and saved to ${outputFile}.css`);
  });
}

async function run() {
  const urlsPath = process.argv[2];
  const urls = JSON.parse(fs.readFileSync(urlsPath, 'utf8'));

  console.log('Starting Puppeteer...');

  for (const url in urls) {
    const outputFile = urls[url];
    console.log(`Generating critical CSS for ${url}...`);
    await generateCriticalCss(url, outputFile);
  }

  console.log('Done!');
}

run();
