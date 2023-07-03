export function minimumPathSumTriangle(data: number[][], row = 0, index = 0): number {
  const value = data[row][index];
  if (row + 1 == data.length) return value;
  else {
    const left = minimumPathSumTriangle(data, row + 1, index);
    const right = minimumPathSumTriangle(data, row + 1, index + 1)
    return value + Math.min(left, right)
  }
}