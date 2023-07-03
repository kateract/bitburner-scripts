export function uniquePathsInAGrid(data: number[]): number {
  const n = data[0]; // Number of rows
  const m = data[1]; // Number of columns
  const currentRow = [];
  currentRow.length = n;

  for (let i = 0; i < n; i++) {
      currentRow[i] = 1;
  }
  for (let row = 1; row < m; row++) {
      for (let i = 1; i < n; i++) {
          currentRow[i] += currentRow[i - 1];
      }
  }

  return currentRow[n - 1];
}

export function uniquePathsInAGrid2(data: number[][]): number {
  const obstacleGrid = [];
    obstacleGrid.length = data.length;
    for (let i = 0; i < obstacleGrid.length; ++i) {
        obstacleGrid[i] = data[i].slice();
    }

    for (let i = 0; i < obstacleGrid.length; i++) {
        for (let j = 0; j < obstacleGrid[0].length; j++) {
            if (obstacleGrid[i][j] == 1) {
                obstacleGrid[i][j] = 0;
            } else if (i==0 && j==0) {
                obstacleGrid[0][0] = 1;
            } else {
                obstacleGrid[i][j] = (i > 0 ? obstacleGrid[i-1][j] : 0) + ( j > 0 ? obstacleGrid[i][j-1] : 0);
            }
        }
    }

    return (obstacleGrid[obstacleGrid.length -1][obstacleGrid[0].length-1]);
}

