function simulateAll(inputs) {
  let seqs = {
    matrix: [],
    retro: [],
    gravity: [],
    roll: [],
    reset: []
  };
  
  let triggered = {};
  
  for (let key of inputs) {
    for (let code in seqs) {
      let secretCode = code.split('');
      let seq = seqs[code];
      
      seq.push(key);
      if (seq.length > secretCode.length) seq.shift();
      
      const isMatch = seq.every((char, index) => char === secretCode[index]);
      if (isMatch && seq.length === secretCode.length) {
        triggered[code] = (triggered[code] || 0) + 1;
        seq.length = 0; // reset
      }
    }
  }
  return triggered;
}

console.log(simulateAll("matrixretrogravityrollreset".split('')));
