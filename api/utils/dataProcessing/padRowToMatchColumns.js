function padRowToMatchColumns(row, columnCount) {
  const paddedRow = Array.from({ length: columnCount }, (_, index) => row[index] || '');
  return paddedRow;
}

module.exports = {
  padRowToMatchColumns
}