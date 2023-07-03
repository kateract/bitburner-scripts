export function arrayJumpingGame(data: number[]): number {
  if (data[0] == 0) return 0;
  let target = data.length - 1;
  console.log(`first target: ${target}`)
  for(let i = target - 1; i >= 0; i--) {
    if(i + data[i] >= target) {
      target = i;
      console.log(`new target: ${target}`)
    }
  }
  return target == 0 ? 1 : 0;
}

export function arrayJumpingGame2(data: number[]): number {
  if (data[0] == 0) return 0;
  const targets = [data.length - 1];
  console.log(`first target: ${targets[0]}`)
  for(let i = targets[0] - 1; i >= 0; i--) {
    if(i + data[i] >= targets[0]) {
      const passed = targets.filter(t => t <= i + data[i]).length
      if (passed > 1) {
        for(let i = 1; i < passed; i++) targets.shift();
      }
      targets.unshift(i);
      console.log(targets);
    }
  }
  if(targets[0] == 0) {
    return targets.length - 1
  }
  return 0;
}