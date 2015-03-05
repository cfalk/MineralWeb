function PageRankFormula(n, weightedSum){
  //Let n === number of nodes total
  var d = 0.85; // "Damping Factor" -- commonly set to 85%.
  return (1-d)/n + d*weightedSum;
}

function makeAdjacencyDict(nodes, edges) {

  adjacency = {};

  // Prepare the empty adjacencies.
  for (var i=0; i < nodes.length; i++) {
    var node = nodes[i];

    if (! adjacency.hasOwnProperty(node.id)) {
      adjacency[node.id] = [];
    }

  }

  for (var i=0; i < edges.length; i++) {
    var edge = edges[i]
    adjacency[edge.source.id].push(edge.target.id);
  }

  return adjacency;
}

function applyPageRank(nodes, edges){
  //Variable Setup.
  var num_nodes = nodes.length;
  var outgoingEdges = makeAdjacencyDict(nodes, edges);
  var numIterations = 3;
  var oldWeights = {};
  var incomingEdges = Array.apply([], Array( nodes.length)).map(
          function () { return [] }
        );

  //Find all the nodes that link to a specific node.
  for (var i=0; i < nodes.length; i++){
    var nodeID = nodes[i]["id"];
    var nodeEdges = outgoingEdges[nodeID];
    var nodeID = nodes[i]["degree"] = nodeEdges.length;

    //Just to make sure each node is accounted for...
    if (incomingEdges[nodeID]===undefined){
      incomingEdges[nodeID] = [];
    }

    for (var j=0; j < nodeEdges.length ; j++){
      var otherNode = nodeEdges[j];

      if (incomingEdges[otherNode]===undefined){
        incomingEdges[otherNode] = [];
      }

      incomingEdges[otherNode].push(nodeID);
    }
  }




  //Initiate the weights as just the probability of choosing any random node.
  var initialProb = 1/parseFloat(nodes.length);
  for (var i=0; i < nodes.length; i++){
    var node = nodes[i];
    oldWeights[node["id"]] = initialProb;
  }


  for (var i=1; i<= numIterations; i++){
    //Variable Setup.
    var currentWeights = {};

    for (var j=0; j < nodes.length ; j++){
      //Varjable Setup.
      var node = nodes[j];
      var nodeIncoming = incomingEdges[node["id"]];
      var oldWeight = oldWeights[node["id"]];
      var sumOut = 0;

      for (var k=0; k < nodeIncoming.length ; k++){
        //Variable Setup.
        var otherName = nodeIncoming[k];
        var otherWeight = oldWeights[otherName];
        var otherOutgoing = outgoingEdges[otherName];
        var outgoingLength = otherOutgoing.length;
        if (outgoingLength==0){
          outgoingLength = num_nodes;
        }

        sumOut+=oldWeights[otherName]/outgoingLength;
      }

      var PageRankResult = PageRankFormula(nodes.length, sumOut);
      currentWeights[node["id"]] = PageRankResult;
    }


    //Clone the last object rather than simply copy a reference to it.
    var oldWeights = JSON.parse(JSON.stringify(currentWeights));
  }

  var maxRank = 10,
      minRank = 2;

  localMinRank = Infinity;
  localMaxRank = 0;
  for (var i=0; i < nodes.length ; i++){
    rank = currentWeights[nodes[i].id];
    if (localMinRank>rank) localMinRank=rank;
    if (localMaxRank<rank) localMaxRank=rank;
  }

  //Set each node to have the value of its weight.
  for (var i=0; i < nodes.length ; i++){
    var node = nodes[i];
    //Scale each node so graph size doesn't affect the visuals too much.
    var rank = currentWeights[node["id"]];
    var normRank = (rank-localMinRank)/(localMaxRank-localMinRank)
    node["value"] = normRank*(maxRank-minRank)+minRank;
  }
}
