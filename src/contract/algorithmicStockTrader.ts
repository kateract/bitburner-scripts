export function algorithmicStockTrader(data: number[]): number {
  let max = 0
  let buyindex = 0
  let sellIndex = 0;
  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      if (data[j] - data[i] > max) {
        buyindex = i;
        sellIndex = j;
        max = data[sellIndex] - data[buyindex];
      }
    }
  }
  return max;
}

export function algorithmicStockTrader2(data: number[]): number {
  let total = 0;
  let index = 0;
  //find first local minimum
  index = findLocalMinimum(index, data);
  //if the stock only drops do nothing
  if (index >= data.length - 1) return 0;
  let buyPrice = data[index];
  while (index < data.length) {
    //find local maxima
    index = findLocalMaxima(index, data);
    total += data[index] - buyPrice;
    buyPrice = 0;
    //find local minima
    index = findLocalMinimum(index, data);
    buyPrice = data[index];
    index++;
  }
  if (buyPrice > 0 && data[index] > buyPrice) total += data[index] - buyPrice
  return total;
}

export function algorithmicStockTrader3(data: number[]): number {
  let hold1 = Number.MIN_SAFE_INTEGER;
  let hold2 = Number.MIN_SAFE_INTEGER;
  let release1 = 0;
  let release2 = 0;
  for (const price of data) {
      release2    = Math.max(release2, hold2 + price);
      hold2       = Math.max(hold2, release1 - price);
      release1    = Math.max(release1, hold1 + price);
      hold1       = Math.max(hold1, price * -1);
  }

  return release2;
  
}

export function algorithmicStockTrader4 (k: number, prices: number[])
{
  const len = prices.length;
  if (len < 2) { return 0; }
  if (k > len / 2) {
      let res = 0;
      for (let i = 1; i < len; ++i) {
          res += Math.max(prices[i] - prices[i-1], 0);
      }

      return res;
  }

  const hold = [];
  const rele = [];
  hold.length = k + 1;
  rele.length = k + 1;
  for (let i = 0; i <= k; ++i) {
      hold[i] = Number.MIN_SAFE_INTEGER;
      rele[i] = 0;
  }

  let cur;
  for (let i = 0; i < len; ++i) {
      cur = prices[i];
      for (let j = k; j > 0; --j) {
          rele[j] = Math.max(rele[j], hold[j] + cur);
          hold[j] = Math.max(hold[j], rele[j-1] - cur);
      }
  }

  return rele[k];
}

function findLocalMaxima(startIndex: number, data: number[]) {
  let index = startIndex;
  while (index + 1 < data.length && data[index] < data[index + 1]) index++;
  return index;
}

function findLocalMinimum(startIndex: number, data: number[]) {
  let index = startIndex;
  while (index + 1 < data.length && data[index] > data[index + 1]) { index++; }
  return index;
}

