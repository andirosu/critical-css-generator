const puppeteer = require('puppeteer-core');
const fs = require('fs');
const penthouse = require('penthouse');
const fetch = require('node-fetch');
const postcss = require('postcss');
const cliProgress = require('cli-progress');

const DELAY_MS = 10000;

async function generateCriticalCss(url, outputFile, progressBar) {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.setViewport({ width: 3840, height: 2160 });
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

  // Parse CSS using postcss
  const processedCss = await postcss([
    (root) => {
      root.walkAtRules('font-face', (rule) => {
        rule.remove(); // Remove @font-face declarations
      });
    },
  ]).process(css, { from: undefined });

  const penthouseOptions = {
    url: url,
    cssString: processedCss.css,
    width: 3840,
    height: 2160,
    timeout: 120000,
    strict: false,
    maxEmbeddedBase64Length: 1000,
    renderWaitTime: DELAY_MS,
    blockJSRequests: false,
  };

  await penthouse(penthouseOptions, async (err, criticalCss) => {
    if (err) {
      console.log(`Error generating critical CSS for ${url}: ${err}`);
      progressBar.increment();
      return;
    }

    if (criticalCss.trim().length === 0) {
      console.log(`No critical CSS found for ${url}`);
      progressBar.increment();
      return;
    }

    fs.writeFileSync(`${outputFile}.css`, criticalCss);
    progressBar.increment();
  });
}

async function run() {
  const urlsPath = process.argv[2];
  const urls = JSON.parse(fs.readFileSync(urlsPath, 'utf8'));

  console.log('Starting Puppeteer...');

  const progressBar = new cliProgress.SingleBar({
    format: 'Generating Critical CSS | {bar} | {value}/{total} Files',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  });

  progressBar.start(Object.keys(urls).length, 0);

  for (const url in urls) {
    const outputFile = urls[url];
    //console.log(`Generating critical CSS for ${url}...`);
    await generateCriticalCss(url, outputFile, progressBar);
  }

  progressBar.stop();
  console.log('Done!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
