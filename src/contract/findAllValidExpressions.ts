export function findAllValidExpressions(data: string, target: number) {

    function helper(res: string[], path:string, data:string, target: number, pos: number, evaluated: number, multed: number) {
        if (pos === data.length) {
            if (target === evaluated) {
                res.push(path);
            }
            return;
        }

        for (let i = pos; i < data.length; ++i) {
            if (i != pos && data[pos] == '0') { break; }
            const cur = parseInt(data.substring(pos, i+1));

            if (pos === 0) {
                helper(res, path + cur, data, target, i + 1, cur, cur);
            } else {
                helper(res, path + "+" + cur, data, target, i + 1, evaluated + cur, cur);
                helper(res, path + "-" + cur, data, target, i + 1, evaluated - cur, -cur);
                helper(res, path + "*" + cur, data, target, i + 1, evaluated - multed + multed * cur, multed * cur);
            }
        }
    }

    const result: string[]= [];
    helper(result, "", data, target, 0, 0, 0);
    
    return result;
  }