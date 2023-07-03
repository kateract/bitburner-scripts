

export function subarrayMaxSum(input: number[]): number[] {
  const left = 0;
  const right = input.length;
  const sums: number[][] = Array(input.length);
  let max = 0;
  let maxX = 0;
  let maxY = 0;
  for (let x = left; x < right; x += 1) {
    sums[x] = Array(input.length);
    for (let y = 0; y < right; y += 1) {
      if (y < x) {
        sums[x][y] = 0;
      } else if (y == x) {
        sums[x][y] = input[y]
      } else {
        sums[x][y] = sums[x][y - 1] + input[y]
      }
      if (sums[x][y] > max) {
        max = sums[x][y];
        maxX = x;
        maxY = y;
      }
    }
  }
  const res = input.slice(maxX, maxY + 1);
  return res;
}