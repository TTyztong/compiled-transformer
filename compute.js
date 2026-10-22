// Execute the exported MLP weights, not an arithmetic opcode dispatcher.
(function(root) {
  function executeMLP(model, op, a, b) {
    if (!model.ops.includes(op)) throw new RangeError('Unknown opcode');
    if (![a, b].every(n => Number.isInteger(n) && n >= -8 && n <= 8)) {
      throw new RangeError('Enter integers from −8 to 8.');
    }
    const input = Array(32).fill(0);
    input[13] = a;
    input[14] = b;
    input[15 + model.ops.indexOf(op)] = 1;
    const pre = model.fullUp.map((row, i) => row.reduce((s, w, j) => s + w * input[j], model.bias[i]));
    const hidden = pre.map(n => Math.max(0, n));
    const output = model.fullDown[23].reduce((s, w, i) => s + w * hidden[i], input[23]);
    return {input, pre, hidden, output};
  }
  root.executeMLP = executeMLP;
  if (typeof module !== 'undefined') module.exports = executeMLP;
})(typeof window !== 'undefined' ? window : globalThis);
