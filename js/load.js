function getAtoms(formula) {
  function removeDuplicates(list) {
    var found = {};
    return list.filter(function(elem) {
      if (found.hasOwnProperty(elem)) {
        return false;
      } else {
        found[elem] = true;
        return true;
      }
    });
  }


  var atoms = []
  var regex = /[A-Z][a-z]?(\+*|-*)/g;

  matches = formula.match(regex);

  if (matches !== null) {
    for (var i=0; i<matches.length; i++) {
      var raw = matches[i];
      var ion = "";

      posIon = raw.match(/\+/g);
      negIon = raw.match(/\-/g);

      var clean = raw.replace(/[-+]/g,"");

      if (posIon!==null && posIon.length) ion = ""+posIon.length+"+";
      if (negIon!==null && negIon.length) ion = ""+negIon.length+"-";

      atoms.push(clean+ion);
    }
  }

  atoms = removeDuplicates(atoms);
  return atoms;
}


function calcSimilarity(node1, node2) {
  var sim = 0;

  for (var i=0; i<node1["atoms"].length; i++) {
    if (node2["atoms"].indexOf(node1["atoms"][i])>=0) sim += 1;
  }

  return sim;
};


function makeEdges(nodes) {
  var threshold = 3;

  var edges = [];
  for (var i=0; i<nodes.length; i++) {
    for (var j=0; j<nodes.length; j++) {
      var similarity = calcSimilarity(nodes[i], nodes[j]);
      if (similarity>threshold) {
        edges.push({"source":i, "target":j, "value":similarity});
      }
    }
  }

  return edges;
}

var colorGen = d3.scale.category20();
var numColors = 0;
var colors = {};
function getColor(d) {
  if (! colors.hasOwnProperty(d["system"])) {
    var newColor = colorGen(numColors++);
    colors[d["system"]] = newColor;
  }
  return colors[d["system"]];
}


function makeGraph(nodes, edges, containerId) {
  var numGraphIterations = 20;

  var width = document.getElementById(containerId).clientWidth;
  var height = document.getElementById(containerId).clientHeight;

  var force = d3.layout.force()
                .gravity(10)
                .size([width, height]);


  force.nodes(nodes)
       .links(edges)


  force.start();
  for (var i = numGraphIterations ; i>0; i--) force.tick();
  force.stop();

  applyPageRank(nodes, edges);

  var svg = d3.select("#"+containerId).append("svg")
              .attr("width", width)
              .attr("height", height);

  var linkElems = svg.selectAll(".link")
      .data(edges)
      .enter().append("line")
      .attr("class", "link")
      .style("stroke", "#eee")
      .style("stroke-width", function(d){ return Math.sqrt(d.value) });

  var nodeElems = svg.selectAll(".node")
      .data(nodes)
      .enter().append("circle")
      .attr("class", "node")
      .style("fill", function(d) { return getColor(d) })
      .attr("r", function(d) { return d.value } );

  nodeElems.append("title")
           .text(function(d) { return d.mineral; });

  var minX = Infinity;
  var minY = Infinity;
  var maxX = 0;
  var maxY = 0;
  for (var i=0; i<nodes.length; i++) {
    var node = nodes[i];
    if (minX>node.x) minX = node.x;
    if (maxX<node.x) maxX = node.x;
    if (minY>node.y) minY = node.y;
    if (maxY<node.y) maxY = node.y;
  }

  var padding = 50;
  function normX(x) { return (x-minX)/(maxX-minX)*(width-2*padding)+padding; }
  function normY(y) { return (y-minY)/(maxY-minY)*(height-2*padding)+padding; }

  nodeElems.attr("transform", function(d) {
    return "translate(" + normX(d.x) + "," + normY(d.y) + ")";
  });

  linkElems.attr("x1", function(d) { return normX(d.source.x) });
  linkElems.attr("x2", function(d) { return normX(d.target.x) });
  linkElems.attr("y1", function(d) { return normY(d.source.y) });
  linkElems.attr("y2", function(d) { return normY(d.target.y) });

}


d3.csv("data/compositions.csv", function(csv) {
  var currentId = 0;

  csv = csv.map(function(row) {
    try {
      row["atoms"] = getAtoms(row["formula"]);
      row["id"] = currentId++;
      return row;
    } catch (err) {
      return undefined;
    }
  });

  csv = csv.filter(function(row) {
    return row!==undefined;
  });

  //TODO: Debugging
  csv = csv.slice(0,2000);

  var edges = makeEdges(csv);

  makeGraph(csv, edges, "graphContainer");

});
