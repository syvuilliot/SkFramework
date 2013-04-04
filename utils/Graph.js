define([
	"../utils/constructor",
	"collections/map",
], function(
	ctr,
	Map
) {

	// for tests only
	window.map = new Map({
		"un": 1,
		"deux": 2
	});

	return ctr(function Graph(){
		this._store = new Map();
	}, {
		addNode: function(node){
			this._store.set(node, new Map());
		},
		removeNode: function(node){
			var adjacents = this.getAdjacents(node);
			adjacents.forEach(function(relatedNode){
				relatedNode.delete(node);
			});
			this._store.delete(node);
		},
		set: function(from, to, value){
			if (! this.has(from)) {this.addNode(from);}
			if (! this.has(to)) {this.addNode(to);}
			this._store.get(from).set(to, value);
		},
		get: function(from, to){
			return this._store.get(from).get(to);
		},
		has: function(node){
			return this._store.has(node);
		},
		// for each node, call cb(adjacents, node, graph)
		// not very usefull, no ?
		forEachNode: function(cb, scope){
			return this._store.forEach(cb, scope);
		},
		// for each value, call cb(value, [from, to], graph)
		forEach: function(cb, scope){
			var graph = this;
			this._store.forEach(function(adjacents, node){
				adjacents.forEach(function(value, adjacent){
					cb.call(scope, value, [node, adjacent], graph);
				});
			});
		},
		getAdjacents: function(node){
			return this._store.get(node).keys();
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
		},
	});
});
