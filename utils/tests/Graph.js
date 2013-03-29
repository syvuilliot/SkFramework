define([
	'teststack!object',
	'teststack/chai!assert',
	'../Graph',
], function(
	registerSuite,
	assert,
	Graph
) {

	var g;

	registerSuite({
		name : "Graph path",
		beforeEach : function() {
			g = new Graph();
			g.addNode("init");
			g.addNode("undef");
			g.addNode("simple");
			g.addNode("number");
			g.addNode("list");
			g.addEdge("init", "undef", "init>undef");
			g.addEdge("undef", "init", "undef>init");
			g.addEdge("init", "simple", "init>simple");
			g.addEdge("simple", "init", "simple>init");
			g.addEdge("simple", "number", "simple>number");
			g.addEdge("number", "simple", "number>simple");
			g.addEdge("simple", "list", "simple>list");
			g.addEdge("list", "simple", "list>simple");
		},
		"path": function(){
			var path = g.getPath("list", "undef");
			assert.deepEqual(path, ["list", "simple", "init", "undef"]);
		},
	});

});