var input_a;
var input_b;
var lcs_positions = [];
var lcs_paths = [];
var recursions = [];
var steps = [];
var step = 0;
var grid = true;
var show_editgraph = false;
var klines = false;
var dcontours = false;
var view_scale = 2;
var algo = 'FWLCS';

function rebuild_dpath_segments() {
    var heads_fw;
    var heads_bw;
    var recursion;

    var newPathSegment = function(left, right) {
        if (left && right && !left.equal(right)) {
            return {
                'k': right.k,
                'edges': DeltaJS.lcs.snake_edges(left, right),
                'display': true,
            };
        }
    };

    var recorder = {
        'onCompute': function(callback, T, limit) {
            heads_fw = {};
            heads_fw[limit.left.k + 1] = limit.left.copy();
            heads_bw = {};
            heads_bw[limit.left.k + limit.delta - 1] = limit.right.copy();
            recursion = {
                'left': [limit.left.x, limit.left.x - limit.left.k],
                'right': [limit.right.x, limit.right.x - limit.right.k],
                'koff': limit.left.k,
                'N': limit.N,
                'M': limit.M,
                'delta': limit.delta,
                'dmax': limit.dmax,
                'pathsfw': [],
                'pathsbw': [],
                'middlesnake': [],
                'dcontsfw': [],
                'dcontsbw': [],
                'display': true
            };
            recursions.push(recursion);

            steps.push(recursion);
        },
        'onSnakeHead': function(head, k0, d, backwards){
            var edges = [];
            var path;

            head = head.copy();
            if (backwards) {
                heads_bw[head.k] = head;
                path = newPathSegment(head, heads_bw[recursion.koff + k0]);
            }
            else {
                heads_fw[head.k] = head;
                path = newPathSegment(heads_fw[recursion.koff + k0], head);
            }

            if (!path) {
                return;
            }

            path.d = d;
            path.pos = [head.x, head.x - head.k];

            if (backwards) {
                recursion.pathsbw.push(path);

                if (!(d in recursion.dcontsbw)) {
                    recursion.dcontsbw[d] = [];
                }
                recursion.dcontsbw[d].push(path);
            }
            else {
                recursion.pathsfw.push(path);

                if (!(d in recursion.dcontsfw)) {
                    recursion.dcontsfw[d] = [];
                }
                recursion.dcontsfw[d].push(path);
            }

            steps.push(path);
        },
        'onMiddleSnake': function(left, right, d) {
            recursion.middlesnake = newPathSegment(left, right);
            steps.push(recursion.middlesnake);
        }
    };

    // store input
    input_a = document.params.A.value;
    input_b = document.params.B.value;

    // reset stuff
    recursions = [];
    steps = [];
    lcs_positions = [];
    lcs_paths = [];

    var lcs = new DeltaJS.lcs[algo](input_a, input_b);
    DeltaJS.lcs.InstallLCSRecorder(lcs, recorder);
    lcs.compute(function(left, right) {
        var path = newPathSegment(left, right);
        var pos;
        if (path) {
            lcs_paths.push(path);
            steps.push(path);
        }
        lcs.forEachPositionInSnake(left, right, function(x,y){
            pos = {
                'x': x+1,
                'y': y+1,
                'display': true
            };
            lcs_positions.push(pos);
            steps.push(pos);
        });
    });
}

function applyfilter() {
    var i;
    for (i = 0; i < steps.length; i++) {
        steps[i].display = (i <= step);
    }
}

function clear() {
    step = 0;
    applyfilter();
    Processing.instances[0].redraw();
}

function refresh() {
    rebuild_dpath_segments();
    step = steps.length;
    applyfilter();
    Processing.instances[0].redraw();
}

function gostep() {
    step++;
    step %= steps.length;
    applyfilter();
    Processing.instances[0].redraw();
}

function toggle_grid(value) {
    grid = value;
    Processing.instances[0].redraw();
}

function toggle_editgraph(value) {
    show_editgraph = value;
    Processing.instances[0].redraw();
}

function toggle_klines(value) {
    klines = value;
    Processing.instances[0].redraw();
}

function toggle_dcontours(value) {
    dcontours = value;
    Processing.instances[0].redraw();
}

function switch_algo(value) {
    algo = value;
    refresh();
}

function change_scale(value) {
    view_scale += value;
    Processing.instances[0].redraw();
}

function save_image() {
    Processing.instances[0].save('lcs.png');
}
