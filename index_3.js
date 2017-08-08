const fs = require('fs');
const path = require('path');
const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');
const { individualScreenshots } = require('./individual_screenshots');
const { instrument } = require('./instrument');

const delay = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms));


const width = 1950;
const height = 1200;

const platform = process.platform;
let fileSuffix;
let chromePath;

if (platform === 'linux') {
    chromePath = path.join(__dirname, 'chrome-linux/chrome');
    fileSuffix = 'linux';
} else if (platform === 'darwin' || platform === 'openbsd' || platform === 'freebsd') {
    chromePath = path.join(__dirname, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium');
    fileSuffix = 'mac';
} else if (platform === 'win32') {
    chromePath = path.join(__dirname, 'chrome-win32\\chrome.exe')
    fileSuffix = 'win32';
} else {
    const msg = 'Unsupported platform: ' + platform;
    throw new Error(msg);
}

const url = `file://${path.join(__dirname, 'index.html')}`;

(async function () {
    console.log('launching');
    const chrome = await chromeLauncher.launch({
        chromeFlags: [
        `--window-size=${width},${height}`,
        '--disable-gpu',
        '--headless',
        '--hide-scrollbars'
        ],
        chromePath
    });

    console.log('chrome has been launched');

    const protocol = await CDP({port: chrome.port});
    const { Emulation, Page, Runtime } = protocol;
    await Page.enable();

    console.log('navigating to ' + url);
    await Page.navigate({ url });

    await Page.loadEventFired();

    console.log(`we're loaded, gonna chill 10 seconds`);

    await delay(10000);

    console.log(`how many visualizations do we have?`);

    const res = await Runtime.evaluate({ expression: `var getCount = function (selector, countAttribute) {
      const elementWithCount = document.querySelector('[' + countAttribute + ']');
      if (elementWithCount) {
        return parseInt(elementWithCount.getAttribute(countAttribute));
      }

      return document.querySelectorAll(selector).length;
    }; 

    getCount('[data-shared-item]', 'data-shared-items-count')` });

    const visCount = res.result.value;

    console.log(`${visCount} dummy`);

    const zoom = 2;
    await Emulation.setDeviceMetricsOverride({
        width: width / zoom,
        height: (height / zoom) * visCount,
        deviceScaleFactor: zoom,
        mobile: false,
        fitWindow: false,
    });

    await Runtime.evaluate({ expression: `

    var positionElements = function(selector, height, width) {
        var visualizations = document.querySelectorAll(selector);
        var visCount = visualizations.length;

        for (var i = 0; i < visCount; i++) {
            var visualization = visualizations[i];
            visualization.style.position = 'fixed';
            visualization.style.top = (height * i) + 'px';
            visualization.style.left = 0;
            visualization.style.width = width + 'px';
            visualization.style.height = height + 'px';
            visualization.style.zIndex = 1;
            visualization.style.backgroundColor = 'inherit';
        }
    }

    positionElements('[data-shared-item]', 1200/${zoom}, 1950/${zoom});
    ` });
    
    await delay(10000);

    const result = await Runtime.evaluate({ returnByValue: true, expression: `
    var getPositions = function (selector, attributes) {
        const elements = document.querySelectorAll(selector);

        // NodeList isn't an array, just an iterator, unable to use .map/.forEach
        const results = [];
        for (const element of elements) {
        const boundingClientRect = element.getBoundingClientRect();
        results.push({
            position: {
            boundingClientRect: {
                y: boundingClientRect.y,
                x: boundingClientRect.x,
                width: boundingClientRect.width,
                height: boundingClientRect.height,
            },  
            scroll: {
                x: window.scrollX,
                y: window.scrollY
            }
            },
            attributes: Object.keys(attributes).reduce((result, key) => {
            const attribute = attributes[key];
            result[key] = element.getAttribute(attribute);
            return result;
            }, {})
        });
        }
        return results;
    };

    getPositions('[data-shared-item]', { title: 'data-title', description: 'data-description' });
    `});

    const elementPositions = result.result.value;

    await instrument('individual screenshots', individualScreenshots(fileSuffix, Page, elementPositions, zoom));

    protocol.close();
    chrome.kill();
})();