var dot = module.exports = {};

dot.graph = {
    charset: "UTF-8",
    labelloc: "t",
    labeljust: "r",
    style: "filled",
    rankdir: "LR",
    margin: 0.2,
    ranksep: 0.5,
    nodesep: 0.4
};
dot.node = {
    style: "solid",
    fontsize: 12,
    margin: "0.1,0.1",
    fontname: "Osaka-Mono",
};
dot.edge = {};

var tab = function(text, level) {
    var t = "";
    for (var i = 0; i < level; i++) {
        t += "\t";
    }
    t += text;
    return t;
};

var escapeQuote = function(text) {
    return '"' + text + '"';
};
var attributes = function(tabLevel, obj) {
    return Object.keys(obj).map(function(key) {
        return tab(key + " = " + escapeQuote(obj[key]), tabLevel);
    }).join(",\n");
};

var blanket = function(tabLevel, name, values) {
    return [
        tab(name, tabLevel) + "[",
        attributes(tabLevel + 1, values),
        tab("]", tabLevel)
    ].join("\n");
};

var nodeGlobal = function() {
    return blanket(1, "node", dot.node);
};
var graphGlobal = function() {
    return blanket(1, "graph", dot.graph);
};
var edgeGlobal = function() {
    return blanket(1, "edge", dot.edge);
};
var section = function(port, text) {
    return "<" + port + ">" + " " + text + "\\l ";
};


var treeToDotDef = function(tree) {
    return Object.keys(tree).map(function(key) {
        var elm = tree[key];
        var noActions = elm.actions.length === 1 && elm.actions[0].text.length === 0;
        return blanket(1, "n" + elm.id, {
            shape: "record",
            label: [
                section("title", elm.name),
                section("see", elm.see.join("\\l")),
                noActions ? null : elm.actions.map(function(action, index) {
                    return section("action" + index, action.text);
                }).join("|"),
            ].filter(function(r) {
                return !!r;
            }).join("|"),
        });
    }).join("\n");
};

var arrow = function(from, to) {
    return tab(from + " -> " + to, 1);
};

var treeToDotArrow = function(tree) {
    return Object.keys(tree).map(function(key) {
        var elm = tree[key];
        return elm.actions.map(function(e, i) {
            var next = tree[e.direction];
            if (!next) {
                return "";
            }
            return arrow("n" + elm.id + ":action" + i, "n" + tree[e.direction].id);

        }).join("\n");
    }).join("\n");
};

var treeToDotRank = function(tree) {
    var ranks = {};
    var result = "";
    Object.keys(tree).forEach(function(key) {
        var elm = tree[key];
        ranks[elm.rank] = ranks[elm.rank] ? ranks[elm.rank] : [];
        ranks[elm.rank].push("n" + elm.id);
    });
    Object.keys(ranks).forEach(function(key) {
        if (key == '1') {
            result += tab("{ rank = source;" + ranks[key].join(";") + ";}", 1);
            result += "\n";
            return;
        }
        if (key != '0') {
            result += tab("{ rank = same;" + ranks[key].join(";") + ";}", 1);
            result += "\n";
            return;
        }
    });
    return result;
};

dot.compile = function(tree) {
    return [
        "digraph D {",
        graphGlobal(),
        nodeGlobal(),
        edgeGlobal(),
        treeToDotDef(tree),
        treeToDotArrow(tree),
        treeToDotRank(tree),
        "}"
    ].join("\n");
};
