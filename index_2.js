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

const url = `http://10.0.1.24:5601/app/kibana#/dashboard/ce22fbb0-778e-11e7-a6c7-ff2fd5300286?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-90d,mode:quick,to:now))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(darkTheme:!f),panels:!((col:1,id:a42ec780-778e-11e7-a6c7-ff2fd5300286,panelIndex:1,row:1,size_x:6,size_y:3,type:visualization),(col:7,id:a42ec780-778e-11e7-a6c7-ff2fd5300286,panelIndex:2,row:1,size_x:6,size_y:3,type:visualization),(col:1,id:a42ec780-778e-11e7-a6c7-ff2fd5300286,panelIndex:3,row:4,size_x:6,size_y:3,type:visualization),(col:7,id:a42ec780-778e-11e7-a6c7-ff2fd5300286,panelIndex:4,row:4,size_x:6,size_y:3,type:visualization),(col:1,id:a42ec780-778e-11e7-a6c7-ff2fd5300286,panelIndex:5,row:7,size_x:6,size_y:3,type:visualization),(col:7,id:adb151b0-778e-11e7-a6c7-ff2fd5300286,panelIndex:6,row:7,size_x:6,size_y:3,type:visualization),(col:1,id:adb151b0-778e-11e7-a6c7-ff2fd5300286,panelIndex:7,row:10,size_x:6,size_y:3,type:visualization),(col:7,id:adb151b0-778e-11e7-a6c7-ff2fd5300286,panelIndex:8,row:10,size_x:6,size_y:3,type:visualization),(col:1,id:adb151b0-778e-11e7-a6c7-ff2fd5300286,panelIndex:9,row:13,size_x:6,size_y:3,type:visualization),(col:1,columns:!(referer,url),id:bd793c70-778e-11e7-a6c7-ff2fd5300286,panelIndex:13,row:16,size_x:6,size_y:3,sort:!('@timestamp',desc),type:search),(col:7,columns:!(referer,url),id:bd793c70-778e-11e7-a6c7-ff2fd5300286,panelIndex:14,row:13,size_x:6,size_y:3,sort:!('@timestamp',desc),type:search),(col:1,columns:!(referer,url),id:bd793c70-778e-11e7-a6c7-ff2fd5300286,panelIndex:15,row:19,size_x:6,size_y:3,sort:!('@timestamp',desc),type:search),(col:7,columns:!(referer,url),id:bd793c70-778e-11e7-a6c7-ff2fd5300286,panelIndex:17,row:16,size_x:6,size_y:3,sort:!('@timestamp',desc),type:search),(col:1,columns:!(referer,url),id:bd793c70-778e-11e7-a6c7-ff2fd5300286,panelIndex:18,row:22,size_x:6,size_y:3,sort:!('@timestamp',desc),type:search),(col:7,columns:!(referer,url),id:bd793c70-778e-11e7-a6c7-ff2fd5300286,panelIndex:19,row:19,size_x:6,size_y:3,sort:!('@timestamp',desc),type:search),(col:1,columns:!(referer,url),id:bd793c70-778e-11e7-a6c7-ff2fd5300286,panelIndex:20,row:25,size_x:6,size_y:3,sort:!('@timestamp',desc),type:search),(col:7,id:adb151b0-778e-11e7-a6c7-ff2fd5300286,panelIndex:21,row:22,size_x:6,size_y:3,type:visualization),(col:1,id:adb151b0-778e-11e7-a6c7-ff2fd5300286,panelIndex:22,row:28,size_x:6,size_y:3,type:visualization),(col:7,id:adb151b0-778e-11e7-a6c7-ff2fd5300286,panelIndex:23,row:25,size_x:6,size_y:3,type:visualization)),query:(language:lucene,query:''),timeRestore:!f,title:'New%20Dashboard',uiState:(),viewMode:view)`;

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

    const zoom = 1;
    await Emulation.setDeviceMetricsOverride({
        width: width / zoom,
        height: (height / zoom) * visCount,
        deviceScaleFactor: zoom,
        mobile: false,
        fitWindow: false,
    });

    await Runtime.evaluate({ expression: `
    var injectCss = function(cssPath) {
        var node = document.createElement('link');
        node.rel = 'stylesheet';
        node.href = cssPath;
        document.getElementsByTagName('head')[0].appendChild(node);
    };

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

    injectCss('http://10.0.1.24:5601/plugins/reporting/styles/reporting-overrides.css');
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
                top: boundingClientRect.x,
                left: boundingClientRect.y,
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

    const { data } = await instrument('screenshot', Page.captureScreenshot({ fromSurface: true }));
    const buffer = Buffer.from(data, 'base64');
    const writePath = path.join(__dirname, `screenshot-${fileSuffix}.png`)
    await promisify(fs.writeFile, fs)(writePath, buffer);

    protocol.close();
    chrome.kill();
})();