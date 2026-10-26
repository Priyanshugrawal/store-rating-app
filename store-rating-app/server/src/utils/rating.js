// Rounds an average (possibly null) to 2 decimals.
exports.roundAvg = (value) => (value === null || value === undefined ? null : Math.round(Number(value) * 100) / 100);
