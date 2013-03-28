define([
	'teststack!object',	'teststack/chai!assert',
	'../DivComponent'
], function(
	registerSuite,		assert,
	Div
) {
	"strict mode";
	
	var owner, domNode, sub1, sub2, subSub1, subSub2;
	registerSuite({
		name: "DOM components",
		beforeEach: function() {
			owner = new Div();

			owner._components.addEachComponentFactory({
				sub1: function() { return new Div(); },
				sub2: function() { return new Div(); },
				subSub1: function() { return document.createElement('div'); },
				subSub2: function() { return document.createElement('div'); }
			});

			sub1 = owner._components.create('sub1');
			sub2 = owner._components.create('sub2');
			subSub1 = owner._components.create('subSub1');
			subSub2 = owner._components.create('subSub2');
		},
		
		"DOM node creation": function() {
			assert.equal(owner.domNode.tagName, 'DIV', "Tag name is 'div'");
		},

		"place single component": function() {
			owner._place(sub1);
			assert(owner.domNode.contains(sub1.domNode), "sub1 in domNode");
			owner._unplace(sub1);
			assert.isFalse(owner.domNode.contains(sub1.domNode), "sub1 no more in domNode");
		},
		
		"place single component by id": function() {
			owner._place('sub1');
			assert(owner.domNode.contains(sub1.domNode), "sub1 in domNode");
			owner._unplace('sub1');
			assert.isFalse(owner.domNode.contains(sub1.domNode), "sub1 no more in domNode");
		},

		"place multiple components": function() {
			owner._placeEach([sub1, 'sub2']);
			assert.equal(owner.domNode.children[0], sub1.domNode, "sub1 in domNode in 1st place");
			assert.equal(owner.domNode.children[1], sub2.domNode, "sub2 in domNode in 2nd place");
			owner._unplace(sub1);
			assert.isFalse(owner.domNode.contains(sub1.domNode), "sub1 no more in domNode");
			assert(owner.domNode.contains(sub2.domNode), "sub2 still in domNode");
			owner._unplace(sub2);
			assert.isFalse(owner.domNode.contains(sub2.domNode), "sub2 no more in domNode");
		},
		
		"place component tree": function() {
			owner._placeEach([
				'sub1',
				['sub2', [
					'subSub1',
					'subSub2'
				]]
			]);
			assert(owner.domNode.contains(sub1.domNode), "place component tree");
			assert(sub2.domNode.contains(subSub1), "place component tree");
			assert(sub2.domNode.contains(subSub2), "place component tree");


		}
	});
});
