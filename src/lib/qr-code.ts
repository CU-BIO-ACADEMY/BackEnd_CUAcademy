import { Jimp } from "jimp";
import jsQR from "jsqr";
import { NotFoundError } from "./error";

export async function readQRCode(imageBuffer: Buffer) {
    const image = await Jimp.read(imageBuffer);

    const imageData = {
        data: new Uint8ClampedArray(image.bitmap.data),
        width: image.bitmap.width,
        height: image.bitmap.height,
    };

    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (!code) throw new NotFoundError("ไม่พบ QR code ในรูปภาพ");

    return code.data;
}
