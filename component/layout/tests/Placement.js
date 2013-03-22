define([
	'teststack!object',	'teststack/chai!assert',
	'dojo/_base/declare',
	'../../ComponentsManager',	'../PlacementManager',	'../OrderManager',	'../FakePlacer'
], function(
	registerSuite,		assert,
	declare,
	ComponentsManager,			PlacementManager,		OrderManager,		FakePlacer
) {
	"strict mode";
	
	var owner, root, sub1, sub2, subSub1, subSub2;
	
	registerSuite({
		name: "Placing with no implementation",
		beforeEach: function() {
			// declared outside of owner as a convenience for tests
			root = new Object();
			sub1 = new Object();

			owner = new (declare([], {
				constructor: function() {
					this._components = new ComponentsManager();
					this._placement = new PlacementManager({
						placers: []
					});

					this._components.add({
						root: root,
						sub1: sub1,
					});
				}
			}))();
		},

		"place without implementation": function() {
			owner._placement.place(sub1, root);
			assert(owner._placement.getParent(sub1) === undefined, "sub1 should not be placed in root");
		}
	});
	
	registerSuite({
		name: "PlacementManager with fake implementation",
		beforeEach: function() {
			// declared outside of owner as a convenience for tests
			root = new Object();
			sub1 = new Object();
			sub2 = new Object();

			owner = new (declare([], {
				constructor: function() {
					this._components = new ComponentsManager();
					this._placement = new PlacementManager({
						root: this._root,
						placers: [new FakePlacer()]
					});

					this._components.add({
						root: root,
						sub1: sub1,
						sub2: sub2
					});
				}
			}))();
		},

		"place single component": function() {
			owner._placement.place(sub1, root);
			assert.equal(owner._placement.getParent(sub1), root, "sub1 placed in root");
			owner._placement.place(sub2, root);
			assert.equal(owner._placement.getParent(sub2), root, "sub2 placed in root");
			owner._placement.unplace(sub1);
			assert(owner._placement.getParent(sub1) === undefined, "sub1 no more placed");
			owner._placement.unplace(sub2);
			assert(owner._placement.getParent(sub2) === undefined, "sub2 no more placed");
		}
	});

	registerSuite({
		name: "OrderManager with fake implementation",
		beforeEach: function() {
			// declared outside of owner as a convenience for tests
			root = new Object();
			sub1 = new Object();
			sub2 = new Object();
			subSub1 = new Object();
			subSub2 = new Object();

			owner = new (declare([], {
				constructor: function() {
					this._components = new ComponentsManager();
					this._placement = new OrderManager({
						root: this._root,
						placers: [new FakePlacer()]
					});

					this._components.add({
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
			assert.equal(owner._placement.getParent(sub1), root, "sub1 placed in root");
			owner._placement.unplace(sub1);
			assert(owner._placement.getParent(sub1) === undefined, "sub1 no more placed");
		},

		"place multiple components": function() {
			owner._placement.place([sub1, sub2], root);
			assert.equal(owner._placement.getParent(sub1), root, "sub1 in root");
			assert.equal(owner._placement.getParent(sub2), root, "sub2 in root");
			owner._placement.unplace(sub1);
			assert(owner._placement.getParent(sub1) === undefined, "sub1 no more placed");
			assert.equal(owner._placement.getParent(sub2), root, "sub2 still in root");
			owner._placement.unplace(sub2);
			assert(owner._placement.getParent(sub2) === undefined, "sub2 no more placed");
		},
		
		"place component tree": function() {
			owner._placement.place([sub1, [subSub1, subSub2]], root);
			assert.equal(owner._placement.getParent(sub1), root, "sub1 in root");
			assert.equal(owner._placement.getParent(subSub1), sub1, "subSub1 in sub1");
			assert.equal(owner._placement.getParent(subSub2), sub1, "subSub2 in sub1");
		}
	});
});
