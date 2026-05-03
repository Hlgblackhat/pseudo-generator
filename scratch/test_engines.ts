import { MixedCongruential } from '../src/engines/mixedCongruential';
import { MultiplicativeCongruential } from '../src/engines/multiplicativeCongruential';
import { AdditiveCongruential } from '../src/engines/additiveCongruential';
import { MiddleSquare } from '../src/engines/middleSquare';
import { LFSRGenerator } from '../src/engines/lfsr';
import { BBSGenerator } from '../src/engines/bbs';
import { LFGGenerator } from '../src/engines/lfg';
import { GeneratorMethod } from '../src/engines/types';

const count = 5;

console.log("--- Mixed Congruential ---");
const mixed = new MixedCongruential(42, 1664525, 1013904223, 4294967296);
for(let i=0; i<count; i++) console.log(mixed.next());

console.log("--- Multiplicative Congruential ---");
const mult = new MultiplicativeCongruential(42, 1664525, 4294967296);
for(let i=0; i<count; i++) console.log(mult.next());

console.log("--- Additive Congruential ---");
const add = new AdditiveCongruential(42, 10, 4294967296);
for(let i=0; i<count; i++) console.log(add.next());

console.log("--- Middle Square ---");
const mid = new MiddleSquare(1234, 4);
for(let i=0; i<count; i++) console.log(mid.next());

console.log("--- LFSR ---");
const lfsr = new LFSRGenerator({seed: 43690, m:0, method: GeneratorMethod.LFSR, useTimeEntropy: false});
for(let i=0; i<count; i++) console.log(lfsr.next());

console.log("--- BBS ---");
const bbs = new BBSGenerator({seed: 12345, p: 499, q: 503, m:0, method: GeneratorMethod.BBS, useTimeEntropy: false});
for(let i=0; i<count; i++) console.log(bbs.next());

console.log("--- LFG ---");
const lfg = new LFGGenerator({seed: 42, j: 7, k: 10, m: 4294967296, method: GeneratorMethod.LFG, useTimeEntropy: false});
for(let i=0; i<count; i++) console.log(lfg.next());
