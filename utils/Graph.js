define([
	"../utils/createConstructor",
], function(
	ctr
) {

	return ctr(function Graph(){
		this._nodes = {};
	}, {
		addNode: function(node){
			this._nodes[node] = {};
		},
		addEdge: function(from, to, value){
			this._nodes[from][to] = value;
		},
		getAdjacents: function(node){
			return Object.keys(this._nodes[node]);
		},
		getPath: function(start, end){
			var visited = {start: undefined}; //keep visisted nodes and store their "parent" (the upper level begining from start)
			var toVisit = [start];
			var from;
			var node;
			var adjacents;
			while (toVisit.length > 0){
				from = toVisit.shift();
				adjacents = this.getAdjacents(from);
				for (var i=0; i < adjacents.length; i++){
					node = adjacents[i];
					if (node in visited) {continue;}
					toVisit.push(node);
					visited[node] = from; // store the parent
					if (node === end) {break;}
				}
			}
			// if end has been found
			if (visited[end]){
				var path = [end];
				node = end;
				while(node !== start) {
					node = visited[node]; // get parent of node
					path.unshift(node);
				}
				return path;
			}
		}

	});






});
