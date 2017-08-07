import fs from 'fs';
import path from 'path';
import { promisify } from 'bluebird';
import { instrument } from './instrument';

export async function individualScreenshots(fileSuffix, Page, elementPositions, zoom) {

    const { data } = await instrument('screenshot', Page.captureScreenshot({ fromSurface: true }));
    const buffer = Buffer.from(data, 'base64');

    const writePath = path.join(__dirname, `screenshot-is-${fileSuffix}.png`)
    await promisify(fs.writeFile, fs)(writePath, buffer);

    let i = 0;
    for (const item of elementPositions) {
        const { boundingClientRect, scroll = { x: 0, y: 0 } } = item.position;
        const clip = {
            x: (boundingClientRect.x) + scroll.y,
            y: (boundingClientRect.y) + scroll.x,
            height: boundingClientRect.height,
            width: boundingClientRect.width,
            scale: 1
        };

        const { data } = await instrument('individual screenshot', Page.captureScreenshot({ clip  }));
        const buffer = Buffer.from(data, 'base64');
        const writePath = path.join(__dirname, `screenshot-is-${fileSuffix}-${i++}.png`)
        await promisify(fs.writeFile, fs)(writePath, buffer);
    }
}