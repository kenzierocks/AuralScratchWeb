import {murmurhash3_32_gc} from "./murmur/mm3";

const hashFunction = (s: string) => murmurhash3_32_gc(s, 0xDEADBEEF);

const MASK_8_BIT = (1 << 8) - 1;

function hexify(n: number) {
    const hex = n.toString(16);
    if (hex.length === 1) {
        return '0' + hex;
    }
    return hex;
}

function brighter(n: number) {
    return Math.trunc(Math.min(256, n + (256 - n) * (0.2)));
}

export function hashColor(input: string) {
    // color data is 24-bit
    // Take top 8 bits and mix them into the rest
    const hash = hashFunction(input);
    const topEight = (hash >> 24) & MASK_8_BIT;
    const red = ((hash >> 0) & MASK_8_BIT) ^ topEight;
    const green = ((hash >> 8) & MASK_8_BIT) ^ topEight;
    const blue = ((hash >> 16) & MASK_8_BIT) ^ topEight;
    return [red, green, blue].map(brighter).map(hexify).join('');
}
