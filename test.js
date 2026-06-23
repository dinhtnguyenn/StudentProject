const assert = require('assert');

function simulate(secretCode, input) {
  let seq = [];
  let triggered = false;
  for (let key of input) {
    seq.push(key);
    if (seq.length > secretCode.length) seq.shift();
    
    const isMatch = seq.every((char, index) => char === secretCode[index]);
    if (isMatch && seq.length === secretCode.length) {
      triggered = true;
      seq = [];
    }
  }
  return triggered;
}

console.log("matrix", simulate("matrix".split(''), "matrix".split('')));
console.log("retro", simulate("retro".split(''), "retro".split('')));
console.log("xretro", simulate("retro".split(''), "xretro".split('')));
