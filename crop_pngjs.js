import fs from 'fs';
const { PNG } = require('pngjs');

export async function cropScreenshot(src, { x, y, height, width }, filePath) {
    
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