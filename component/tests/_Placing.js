define([
	'teststack!object',	'teststack/chai!assert',
	'dojo/_base/declare',
	'../Component',	'../_Placing',	'../_PlacingFakeImplementation'
], function(
	registerSuite,		assert,
	declare,
	Component,		_Placing,		_PlacingFake
) {
	"strict mode";
	
	var owner, root, sub1, sub2, subSub1, subSub2;
	
	registerSuite({
		name: "Placing with no implementation)",
		beforeEach: function() {
			owner = new (declare([Component, _Placing]))();
			root = new Component();
			sub1 = new Component();
			owner._addComponents({
				root: root,
				sub1: sub1,
			});
		},

		"place without implementation": function() {
			owner._place(sub1, root);
			assert(owner._placedComponents.has(sub1) === false, "sub1 could not be placed in root");
		}
	});
	
	registerSuite({
		name: "Placing with fake implementation)",
		beforeEach: function() {
			owner = new (declare([Component, _Placing, _PlacingFake]))();
			root = new Component();
			sub1 = new Component();
			sub2 = new Component();
			subSub1 = new Component();
			subSub2 = new Component();
			owner._addComponents({
				root: root,
				sub1: sub1,
				sub2: sub2,
				subSub1: subSub1,
				subSub2: subSub2
			});
		},

		"place single component": function() {
			owner._place(sub1, root);
			assert.equal(owner._placedComponents.get(sub1), root, "sub1 placed in root");
			owner._unplace(sub1);
			assert(owner._placedComponents.has(sub1) === false, "sub1 no more placed");
		},
		
		"place single component by id": function() {
			owner._place('sub1', 'root');
			assert.equal(owner._placedComponents.get(sub1), root, "sub1 placed in root");
			owner._unplace(sub1);
			assert(owner._placedComponents.has(sub1) === false, "sub1 no more placed");
		},

		"place multiple components": function() {
			owner._place([sub1, 'sub2'], root);
			assert.equal(owner._placedComponents.get(sub1), root, "sub1 in root");
			assert.equal(owner._placedComponents.get(sub2), root, "sub2 in root");
			owner._unplace(sub1);
			assert(owner._placedComponents.has(sub1) === false, "sub1 no more placed");
			assert.equal(owner._placedComponents.get(sub2), root, "sub2 still in root");
			owner._unplace(sub2);
			assert(owner._placedComponents.has(sub2) === false, "sub2 no more placed");
		},
		
		"place component tree": function() {
			owner._place([sub1, [subSub1, subSub2]], root);
			assert.equal(owner._placedComponents.get(sub1), root, "sub1 in root");
			assert.equal(owner._placedComponents.get(subSub1), sub1, "subSub1 in sub1");
			assert.equal(owner._placedComponents.get(subSub2), sub1, "subSub2 in sub1");
		}
	});
});
