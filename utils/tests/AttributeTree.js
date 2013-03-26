
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
	
	var tree, root, sub1, sub1Attr, sub2, subSub1, subSub1Attr;
	
	registerSuite({
		name: "Tree of attributed nodes",
		beforeEach: function() {
			// declared outside of owner as a convenience for tests
			root = new Object();
			sub1 = new Object();
			sub1Attr = new Object();
			sub2 = new Object();
			subSub1 = new Object();
			subSub1Attr = new Object();

			tree = new AttributeTree();
		},

		"main tests": function() {
			tree.add(sub1, root, sub1Attr);
			assert.equal(tree.getParent(sub1), root, "sub1 under root");
			assert.equal(tree.getAttribute(sub1), sub1Attr, "sub1 attributes retrievable");
			tree.add(sub2, root);
			assert.equal(tree.getParent(sub2), root, "sub2 under root");
			assert(tree.getChildren(root).length === 2, "can get children of root");
			tree.add(subSub1, sub1, subSub1Attr);
			assert.equal(tree.getParent(subSub1), sub1, "subSub1 under sub1");
			assert.equal(tree.getAttribute(subSub1), subSub1Attr, "subSub1 attributes retrievable");
			tree.remove(sub1);
			assert(tree.getParent(sub1) === undefined, "sub1 no more in tree");
		}
	});
});
