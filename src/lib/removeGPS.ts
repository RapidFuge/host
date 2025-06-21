import { removeLocation } from '@rapidfuge/gps-metadata-remover';
import fs from 'fs-extra';

export default (file: string): Promise<boolean> => {
    let fileDescriptor: number | undefined;

    return fs.open(file, 'r+')
        .then((fd) => {
            fileDescriptor = fd;
            return removeLocation(
                file,
                (size: number, offset: number): Promise<ArrayBuffer> =>
                    fs.read(fd, Buffer.alloc(size), 0, size, offset)
                        .then(({ buffer }) => buffer.buffer),
                (data: ArrayBuffer, offset: number): Promise<void> =>
                    fs.write(fd, Buffer.from(data), 0, data.byteLength, offset)
                        .then(() => { })
            );
        })
        .finally(() => {
            if (fileDescriptor !== undefined) {
                return fs.close(fileDescriptor)
                    .catch(err => {
                        console.error(`Failed to close file descriptor for ${file}:`, err);
                    });
            }
            return Promise.resolve();
        });
};