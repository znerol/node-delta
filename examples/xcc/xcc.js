var nodes_a;
var nodes_b;
var matches;
var showMatchlines = true;
var detectLeafUpdates = false;
var originalLeafUpdateDetection = false;
var removes;
var inserts;
var updates;
var view_scale = 2;
var steps = [];
var step = 0;

function rebuild() {
    var root_a, root_b, width_a;
    var matchingrec, xccrec, pass, xcc, delta, updater;

    matchingrec = {
        'onPut': function(b, a) {
            var match = {
                'display': true,
                'a': a,
                'b': b,
                'pass': pass
            };
            steps.push(match);
            matches.push(match);
        }
    };

    xccrec = {
        'onMatchLeafLCS': function() {
            pass++;
        },
        'onMatchLeafUpdates': function() {
            pass++;
        }
    }

    // parse tree
    root_a = DeltaJS.xcc.parse_tree(document.params.A.value);
    root_b = DeltaJS.xcc.parse_tree(document.params.B.value);

    // calculate node positions
    width_a = DeltaJS.xcc.layout_tree(root_a, 32, 32);
    DeltaJS.xcc.layout_tree(root_b, 32, 32, width_a + 32);

    // create flat array of nodes
    nodes_a = [];
    nodes_b = [];
    root_a.forEach(function(n) {
        nodes_a.push(n);
    });
    root_b.forEach(function(n) {
        nodes_b.push(n);
    });

    // reset stuff
    pass = 0;
    steps = [];
    matches = [];
    inserts = [];
    removes = [];
    updates = [];

    options = {
        'detectLeafUpdates': !!detectLeafUpdates
    };

    // run xcc
    matching = new DeltaJS.tree.Matching();
    DeltaJS.xcc.InstallMatchingRecorder(matching, matchingrec);

    xcc = new DeltaJS.xcc.Diff(root_a, root_b, options);
    if (originalLeafUpdateDetection) {
        DeltaJS.xcc.InstallXCCOriginalLeafUpdateAlgorithm(xcc);
    }
    DeltaJS.xcc.InstallXCCRecorder(xcc, xccrec);

    xcc.matchTrees(matching, options);

    collector = new DeltaJS.delta.DeltaCollector(matching, root_a, root_b);
    collector.forEachChange(function(op) {
        var dispop;
        switch (op.type) {
            case DeltaJS.delta.UPDATE_NODE_TYPE:
                dispop = {
                    'display': true,
                    'nodes': op.remove.concat(op.insert)
                };
                steps.push(dispop);
                updates.push(dispop);
                break;

            case DeltaJS.delta.UPDATE_FOREST_TYPE:
                if (op.remove.length > 0) {
                    dispop = {
                        'display': true,
                        'nodes': flatten(op.remove)
                    };
                    steps.push(dispop);
                    removes.push(dispop);
                }

                if (op.insert.length > 0) {
                    dispop = {
                        'display': true,
                        'nodes': flatten(op.insert)
                    };
                    steps.push(dispop);
                    inserts.push(dispop);
                }
                break;
        }
    });
}

function flatten(nodes) {
    var i, result = [];
    for (i=0; i < nodes.length; i++) {
        nodes[i].forEach(function(n) {
            result.push(n);
        });
    }
    return result;
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
    rebuild();
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

function toggle_matchlines(value) {
    showMatchlines = value;
    Processing.instances[0].redraw();
}

function switch_lud(value) {
    detectLeafUpdates = (value !== "0");
    originalLeafUpdateDetection = (value === "2");
    refresh();
}
function change_scale(value) {
    view_scale += value;
    Processing.instances[0].redraw();
}

function save_image() {
    Processing.instances[0].save('xcc.png');
}
