const fs = require('fs');
const path = require('path');
const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');
const { promisify } = require('bluebird');

const delay = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms));

const instrument = async (description, promise) => {
  const start = new Date();
  const result = await promise;
  console.log(`${description} took ${new Date() - start} ticks`);
  return result;
};

const writeData = async (name, data) => {
    const buffer = Buffer.from(data, 'base64');
    const writePath = path.join(__dirname, `${name}.png`)
    await promisify(fs.writeFile, fs)(writePath, buffer);
};

const screenshot = async (Page, name, options) => {
    const { data } = await instrument(name, Page.captureScreenshot(options));
    await writeData(name, data);
};

const width = 1950;
const height = 1200;

const url = `https://www.google.com`;

(async function () {
    const chrome = await chromeLauncher.launch({
        chromeFlags: [
        `--window-size=${width},${height}`,
        '--disable-gpu',
        '--headless',
        '--hide-scrollbars'
        ],
        chromePath: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'
    });

    const protocol = await CDP({port: chrome.port});
    const { Emulation, Page, Runtime } = protocol;
    await Page.enable();

    await Page.navigate({ url });

    await Page.loadEventFired();

    // const zoom = 2;
    // await Emulation.setDeviceMetricsOverride({
    //     width: width / zoom,
    //     height: (height / zoom) * 2,
    //     deviceScaleFactor: zoom,
    //     mobile: false,
    //     fitWindow: false,
    // });

    await screenshot(Page, 'non-clipped');

    const clip = {
        x: 0,
        y: 0,
        height: height,
        width: width,
        scale: 1
    };

    await screenshot(Page, 'clipped', { clip });

    protocol.close();
    chrome.kill();
})();