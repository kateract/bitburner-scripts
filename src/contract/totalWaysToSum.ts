export function totalWaysToSum(n: number): number {
  const ways = Array.from({ length: n + 1 }, (_, i) => 0);
  ways[0] = 1;
  for (let x = 1; x < n; x++) {
    for (let y = 1; y < n + 1; y++) {
      if (y >= x) {
        ways[y] += ways[y - x]
      }
    }
  }
  return ways[n];
}
export function totalWaysToSum2(n: number, set: number[]): number {
  const ways = Array(n+1).fill(0);
  ways[0] = 1;
  for (let i = 0; i < set.length; i++) {
    for (let j = set[i]; j <= n; j++) {
      ways[j] += ways[j - set[i]]
    }
  }
  return ways[n];
}