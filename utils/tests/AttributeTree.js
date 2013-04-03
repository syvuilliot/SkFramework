
define([
	'teststack!object',	'teststack/chai!assert',
	'dojo/_base/declare',
	'../AttributeTree'
], function(
	registerSuite,		assert,
	declare,
	AttributeTree
) {
	"strict mode";

	var tree, root, rootAttr, sub1, sub1Attr, sub2, subSub1, subSub1Attr, subSub2;

	registerSuite({
		name: "Tree of attributed nodes",
		beforeEach: function() {
			// declared outside of owner as a convenience for tests
			root = {name: "root"};
			rootAttr = {name: "rootAttr"};
			sub1 = {name: "sub1"};
			sub1Attr = {$: "sub1Attr"};
			sub2 = {name: "sub2"};
			subSub1 = {name: "subSub1"};
			subSub1Attr = {};
			subSub2 = {$: "subSub2"};

			tree = new AttributeTree();
			tree.set(sub1, root, sub1Attr);
			tree.set(sub2, root);
			tree.set(subSub1, sub1, subSub1Attr);
		},


		"create an empty tree": function  () {
			tree = new AttributeTree();
			assert(Object.hasOwnProperty(tree, "root") === false);
			assert(tree.getRoot() === undefined);
			assert(tree.length === 0);
		},

		"create a tree with one value": function  () {
			tree = new AttributeTree(root);
			assert(tree.has(root));
			assert(tree.getRoot() === root);
			assert(tree.length === 1);
		},

		"using api": function() {
			assert.equal(tree.getParent(sub1), root, "sub1 under root");
			assert.equal(tree.getAttribute(sub1), sub1Attr, "sub1 attributes retrievable");
			assert.equal(tree.getParent(sub2), root, "sub2 under root");
			assert(tree.getChildren(root).length === 2, "can get children of root");
			assert.equal(tree.getParent(subSub1), sub1, "subSub1 under sub1");
			assert.equal(tree.getAttribute(subSub1), subSub1Attr, "subSub1 attributes retrievable");
		},

		"create from literal one level": function(){
			var tree = new AttributeTree([root, [
				sub1,
				sub2,
			]]);
			assert(tree.getRoot() === root);
			assert(tree.has(root));
			assert(tree.has(sub1));
			assert(tree.has(sub2));
			assert(tree.length === 3);
			assert.deepEqual(tree.getChildren(root), [sub1, sub2]);
			assert(tree.getParent(sub1) === root);
			assert(tree.getParent(sub2) === root);
		},

		"create from literal 2 levels": function(){
			var tree = new AttributeTree([root, [
				[sub1, [
					subSub1,
					subSub2,
				]],
				sub2,
			]]);
			assert(tree.getRoot() === root);
			assert(tree.has(root));
			assert(tree.has(sub1));
			assert(tree.has(sub2));
			assert(tree.length === 5);
			assert.deepEqual(tree.getChildren(root), [sub1, sub2]);
			assert(tree.getParent(sub1) === root);
			assert(tree.getParent(sub2) === root);
			assert.deepEqual(tree.getChildren(sub1), [subSub1, subSub2]);
			assert(tree.getParent(subSub1) === sub1);
			assert(tree.getParent(subSub2) === sub1);
		},
		"create from literal one level with value": function(){
			var tree = new AttributeTree([[root, rootAttr], [
				[sub1, sub1Attr],
			]]);
			assert(tree.getRoot() === root);
			assert(tree.has(root));
			assert(tree.has(sub1));
			assert(tree.length === 2);
			assert.deepEqual(tree.getChildren(root), [sub1]);
			assert(tree.getParent(sub1) === root);
			assert(tree.getAttribute(root) === rootAttr);
			assert(tree.getAttribute(sub1) === sub1Attr);
		},
		"create from literal 2 levels with values": function(){
			var tree = new AttributeTree([[root, rootAttr], [
				[[sub1, sub1Attr], [
					[subSub1, subSub1Attr],
					subSub2,
				]],
				sub2,
			]]);
			assert(tree.getRoot() === root);
			assert(tree.has(root));
			assert(tree.has(sub1));
			assert(tree.has(sub2));
			assert(tree.length === 5);
			assert.deepEqual(tree.getChildren(root), [sub1, sub2]);
			assert(tree.getParent(sub1) === root);
			assert(tree.getParent(sub2) === root);
			assert.deepEqual(tree.getChildren(sub1), [subSub1, subSub2]);
			assert(tree.getParent(subSub1) === sub1);
			assert(tree.getParent(subSub2) === sub1);
			assert(tree.getAttribute(root) === rootAttr);
			assert(tree.getAttribute(sub1) === sub1Attr);
			assert(tree.getAttribute(subSub1) === subSub1Attr);
			assert(tree.getAttribute(sub2) === undefined);
		},

		forEach: function(){
			var tree = new AttributeTree([[root, rootAttr], [
				[[sub1, sub1Attr], [
					[subSub1, subSub1Attr],
					subSub2,
				]],
				sub2,
			]]);
			var nodes = [];
			var parents = [];
			var attrs = [];
			tree.forEach(function(node, parent, attr){
				nodes.push(node);
				parents.push(parent);
				attrs.push(attr);
			});
			assert.deepEqual(nodes, [root, sub1, subSub1, subSub2, sub2]);
			assert.deepEqual(parents, [undefined, root, sub1, sub1, root]);
			assert.deepEqual(attrs, [rootAttr, sub1Attr, subSub1Attr, undefined, undefined]);
		},
		map: function(){
			window.map = tree.map(function(node){
				return node.name;
			});
		}

	});
});
