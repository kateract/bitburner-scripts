export function mergeOverlappingIntervals(data: number[][]): number[][] {
  data.sort((a, b) => a[0] - b[0]);
  const res: number[][] = [];
  res.push(data[0]);
  let head = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] <= res[head][1]) {
      if (data[i][1] > res[head][1]) {
        res[head][1] = data[i][1];
      }
    } else {
      res.push(data[i]);
      head++;
    }
  }
  return res;
}