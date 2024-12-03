import { randomBytes } from 'crypto';
const zeroWidthChars = ['\u200B', '\u200C', '\u200D', '\u2060'];
const MIN_LENGTH = 12;

export default (length = MIN_LENGTH) => {
    if (length < MIN_LENGTH) length = MIN_LENGTH;
    return [...randomBytes(length)].map((byte) => zeroWidthChars[Number(byte) % zeroWidthChars.length]).join('').slice(1).concat(zeroWidthChars[0]);
};
export const checkIfZws = (str: string) => str.split('').every(char => zeroWidthChars.includes(char));