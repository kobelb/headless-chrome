import fs from 'fs';
import path from 'path';
import { promisify } from 'bluebird';
import { instrument } from './instrument';
import { PNG } from 'pngjs';

async function cropScreenshot(src, { x, y, height, width }, filePath) {
    
    const dst = new PNG({ width, height });
    src.bitblt(dst, x, y, width, height, 0, 0);
    
    return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(filePath);
        writeStream.on('error', reject)
        dst.pack()
            .on('error', reject)
            .on('end', resolve)
            .pipe(writeStream);
    });
}

export async function oneThenCrop(fileSuffix, Page, elementPositions, zoom) {
    const { data } = await instrument('screenshot', Page.captureScreenshot({ fromSurface: true }));
    const buffer = Buffer.from(data, 'base64');

    const writePath = path.join(__dirname, `screenshot-otc-${fileSuffix}.png`)
    await promisify(fs.writeFile, fs)(writePath, buffer);

    const png = new PNG({ filterType: 4 });
    await instrument('creating src png', promisify(png.parse, { context: png })(buffer));

    let i = 0;
    for (const item of elementPositions) {
        const partPath = path.join(__dirname, `screenshot-otc-${fileSuffix}-${i++}.png`)
        const { scroll, boundingClientRect } = item.position;
        const cropPosition = {
            x: scroll.x + (boundingClientRect.x * zoom),
            y: scroll.y + (boundingClientRect.y * zoom),
            height: boundingClientRect.height * zoom,
            width: boundingClientRect.width * zoom,
        };
        await instrument('cropping screenshot', cropScreenshot(png, cropPosition, partPath));
    }
}