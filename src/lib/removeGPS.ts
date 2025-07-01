import { ExifTool } from 'exiftool-vendored';
import fs from 'fs';

const exiftool = new ExifTool();

export default async function removeExifLocationDataVendored(filePath: string): Promise<boolean> {
    try {
        if (!fs.existsSync(filePath)) return false;

        await exiftool.write(filePath, {}, {
            writeArgs: [
                '-GPS*=',
                '-XMP:GPS*=',
                '-IPTC:GPS*=',
                '-overwrite_original'
            ]
        });

        await exiftool.end();

        return true;

    } catch {
        return false;
    }
}