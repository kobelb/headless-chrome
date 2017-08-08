import sharp from 'sharp';
import { promisify } from 'bluebird';

export async function cropScreenshot(buffer, { x, y, height, width }, filePath) {
    const result = await sharp(buffer)
        .extract({ left: x, top: y, height, width})
        .toFile(filePath);

    return;
}