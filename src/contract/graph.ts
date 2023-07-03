export function proper2ColoringGraph(N: number, edges: number[][]): number[] {
  //Helper function to get neighbourhood of a vertex
  function neighbourhood(vertex: number) {
    const adjLeft = edges.filter(([a, _]) => a == vertex).map(([_, b]) => b);
    const adjRight = edges.filter(([_, b]) => b == vertex).map(([a, _]) => a);
    return adjLeft.concat(adjRight);
}

const coloring = Array(N).fill(undefined);
while (coloring.some((val) => val === undefined)) {
    //Color a vertex in the graph
    const initialVertex = coloring.findIndex((val) => val === undefined);
    coloring[initialVertex] = 0;
    const frontier = [initialVertex];

    //Propogate the coloring throughout the component containing v greedily
    while (frontier.length > 0) {
        const v = frontier.pop() || 0;
        const neighbors = neighbourhood(v);

        //For each vertex u adjacent to v
        for (const id in neighbors) {
            const u = neighbors[id];

            //Set the color of u to the opposite of v's color if it is new,
            //then add u to the frontier to continue the algorithm.
            if (coloring[u] === undefined) {
                if (coloring[v] === 0) coloring[u] = 1;
                else coloring[u] = 0;

                frontier.push(u);
            }

            //Assert u,v do not have the same color
            else if (coloring[u] === coloring[v]) {
                //If u,v do have the same color, no proper 2-coloring exists
                return [];
            }
        }
    }
}

//If this code is reached, there exists a proper 2-coloring of the input graph.
return coloring;
}