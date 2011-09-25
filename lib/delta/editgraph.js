/**
 * @file:   Implementation of Myers longest common subsequence algorithm using
 *          an edit graph.
 * @see:
 * * http://dx.doi.org/10.1007/BF01840446
 * * http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */


function Editgraph() {
}

Editgraph.prototype.equals = function(a, b) {
    return (a === b);
}

Editgraph.prototype.down = function(x, y) {
    throw new Error('Editgraph.down(x, y) is an abstract method. Please implement it in your object');
}

Editgraph.prototype.right = function(x, y) {
    throw new Error('Editgraph.right(x, y) is an abstract method. Please implement it in your object');
}

Editgraph.prototype.right = function(x, y) {
    throw new Error('Editgraph.diag(x, y) is an abstract method. Please implement it in your object');
}


/**
 * Calculates the longest common subsequence from arrays a and b.
 */
Editgraph.prototype.editgraph_simple = function (a, b, dmax) {
    var N = a.length;
    var M = b.length;
    var d, k, x, y;
    var V = [];

    V[1] = 0;
    if (!dmax) {
        dmax = N + M;
    }

    for (d = 0; d <= dmax; d++) {
        for (k = -d; k <= d; k+=2) {
            // figure out if we have to move down or right from the previous
            // k-line.
            if (k == -d || (k != d && V[k-1] < V[k+1])) {
                // down
                x = V[k+1];
                y = x-k;
                this.down(x, y);
            }
            else {
                // right
                x = V[k-1]+1;
                y = x-k;
                this.right(x, y);
            }


            // follow the diagonal
            while (x < N && y < M && this.equals(a[x], b[y])) {
                x++;
                y++;
                this.diag(x, y);
            }

            // store endpoint
            V[k] = x;

            // check if we are done
            if (x >= N && y >= M) {
                return;
            }
        }
    }

    throw new Error('Reached an impossible state. Seems there is an error in the implementation of the LCS algorithm!');
}

exports.Editgraph = Editgraph;
