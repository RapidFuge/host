// Btw, this, and the generators are all from the project https://github.com/tycrek/ass. Nice stuff.
import { removeLocation } from '@xoi/gps-metadata-remover';
import fs from 'fs-extra';

export default (file: string): Promise<boolean> => {
    return new Promise((resolve, reject) =>
        fs.open(file, 'r+')
            .then((fd) => removeLocation(file,
                // Read function
                (size: number, offset: number): Promise<Buffer> =>
                    fs.read(fd, Buffer.alloc(size), 0, size, offset)
                        .then(({ buffer }) => Promise.resolve(buffer)),
                // Write function
                (val: string, offset: number, enc: BufferEncoding): Promise<void> =>
                    fs.write(fd, Buffer.alloc(val.length, val, enc), 0, val.length, offset)
                        .then(() => Promise.resolve())))
            .then(resolve)
            .catch(reject));
}