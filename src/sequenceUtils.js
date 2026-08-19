export const clean = (sequence = '') =>
  String(sequence).toUpperCase().replace(/[^ACGTN]/g, '');

export const stats = (sequence = '') => {
  const value = clean(sequence);
  const counts = { A: 0, C: 0, G: 0, T: 0, N: 0 };
  [...value].forEach((base) => {
    if (counts[base] !== undefined) counts[base] += 1;
  });
  const n = value.length;
  return {
    n,
    c: counts,
    gc: n ? (((counts.G + counts.C) / n) * 100).toFixed(2) : '0.00',
    at: n ? (((counts.A + counts.T) / n) * 100).toFixed(2) : '0.00'
  };
};

export const rc = (sequence = '') =>
  [...clean(sequence)]
    .reverse()
    .map((base) => ({ A: 'T', T: 'A', G: 'C', C: 'G', N: 'N' }[base] || 'N'))
    .join('');
