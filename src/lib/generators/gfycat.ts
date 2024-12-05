import fs from 'fs-extra';
import path from 'path';
const MIN_LENGTH = 1;
const count = 2;

function getWord(list: string[], delim = '') {
    return list[Math.floor(Math.random() * list.length)].concat(delim);
}

export default (_count = MIN_LENGTH) => {
    // For some reason these 3 lines MUST be inside the function
    const adjectives = fs.readFileSync(path.join(process.cwd(), './adjectives.txt')).toString().split('\n');
    const animals = fs.readFileSync(path.join(process.cwd(), './animals.txt')).toString().split('\n');

    let gfycat = '';
    for (let i = 0; i < (count < MIN_LENGTH ? MIN_LENGTH : count); i++)
        gfycat += getWord(adjectives, '-');
    return gfycat.concat(getWord(animals));
};