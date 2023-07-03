export function spiralizeMatrix( data: number[][]): number[] {
  const width = data[0].length - 1;
  const height = data.length - 1;
  const res: number[] = []
  if(width == 0) return data.map(d => d[0])
  if(height == 0) return data[0];
  const expected = data.length * data[0].length;
  spiral( data, 0, 0, width, height, res)
  if (expected == res.length) {
    return res;
  }
  else {
    return [];
  }
}

function spiral( data: number[][], startx: number, starty: number, endx: number, endy: number, res: number[]) {
  if (startx <= endx) {
    for (let i = startx; i <= endx; i++) {
      res.push(data[starty][i])
    }
  }
  if (starty < endy) {
    for (let i = starty + 1; i < endy; i++) {
      res.push(data[i][endx])
    }
  }
  if (startx <= endx && starty < endy) {
    for (let i = endx; i >= startx; i--) {
      res.push(data[endy][i])
    }
    if (startx < endx) {
      for (let i = endy - 1; i > starty; i--) {
        res.push(data[i][startx])
      }
    }
  }
  if (startx == endx && starty == endy) {
    res.push(data[startx][starty])
  }
  if (endx - startx > 1 && endy - starty > 1) {
    spiral(data, startx + 1, starty + 1, endx - 1, endy - 1, res);
  }
}
