define([
	'teststack!object',	'teststack/chai!assert',
	'dojo/_base/declare',
	'../Component',	'../PlacementManager',	'../FakePlacer'
], function(
	registerSuite,		assert,
	declare,
	Component,		PlacementManager,		FakePlacer
) {
	"strict mode";
	
	var owner, root, sub1, sub2, subSub1, subSub2;
	
	registerSuite({
		name: "Placing with no implementation",
		beforeEach: function() {
			// declared outside of owner as a convenience for tests
			root = new Component();
			sub1 = new Component();

			owner = new (declare([Component], {
				constructor: function() {
					this._placement = new PlacementManager({
						placers: []
					});

					this._addComponents({
						root: root,
						sub1: sub1,
					});
				}
			}))();
		},

		"place without implementation": function() {
			owner._placement.place(sub1, root);
			assert(owner._placement._tree.has(sub1) === false, "sub1 could not be placed in root");
		}
	});
	
	registerSuite({
		name: "Placing with fake implementation",
		beforeEach: function() {
			// declared outside of owner as a convenience for tests
			root = new Component();
			sub1 = new Component();
			sub2 = new Component();
			subSub1 = new Component();
			subSub2 = new Component();

			owner = new (declare([Component], {
				constructor: function() {
					this._placement = new PlacementManager({
						root: this._root,
						placers: [new FakePlacer()]
					});

					this._addComponents({
						root: root,
						sub1: sub1,
						sub2: sub2,
						subSub1: subSub1,
						subSub2: subSub2
					});
				}
			}))();
		},

		"place single component": function() {
			owner._placement.place(sub1, root);
			assert.equal(owner._placement._tree.get(sub1), root, "sub1 placed in root");
			owner._placement.unplace(sub1);
			assert(owner._placement._tree.has(sub1) === false, "sub1 no more placed");
		},

		"place multiple components": function() {
			owner._placement.place([sub1, sub2], root);
			assert.equal(owner._placement._tree.get(sub1), root, "sub1 in root");
			assert.equal(owner._placement._tree.get(sub2), root, "sub2 in root");
			owner._placement.unplace(sub1);
			assert(owner._placement._tree.has(sub1) === false, "sub1 no more placed");
			assert.equal(owner._placement._tree.get(sub2), root, "sub2 still in root");
			owner._placement.unplace(sub2);
			assert(owner._placement._tree.has(sub2) === false, "sub2 no more placed");
		},
		
		"place component tree": function() {
			owner._placement.place([sub1, [subSub1, subSub2]], root);
			assert.equal(owner._placement._tree.get(sub1), root, "sub1 in root");
			assert.equal(owner._placement._tree.get(subSub1), sub1, "subSub1 in sub1");
			assert.equal(owner._placement._tree.get(subSub2), sub1, "subSub2 in sub1");
		}
	});
});
