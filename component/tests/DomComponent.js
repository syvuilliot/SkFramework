define([
	'teststack!object',	'teststack/chai!assert',
	'../DomComponent'
], function(
	registerSuite,		assert,
	DomComponent
) {
	"strict mode";

	var owner, domNode, sub1, sub2, subSub1, subSub2;
	registerSuite({
		name: "DOM components",
		beforeEach: function() {
			owner = new DomComponent();

			owner._factory.addEach({
				sub1: function() { return new DomComponent(); },
				sub2: function() { return document.createElement('div'); },
				subSub1: function() { return new DomComponent(); },
				subSub2: function() { return document.createElement('div'); }
			});

			owner._bindings.addEach([
				[['sub1', 'sub2'], function() { return true; }],
				[['subSub1', 'subSub2'], function() { return true; }]
			]);

			sub1 = owner._factory.create('sub1');
			sub2 = owner._factory.create('sub2');
			subSub1 = owner._factory.create('subSub1');
			subSub2 = owner._factory.create('subSub2');
		},

		"DOM-node creation": function() {
			assert.equal(owner.domNode.tagName, 'DIV', "Tag name is 'div'");
		},

		"set name of components based on their registry id": function(){
			assert.equal(sub1.name, "sub1");
			assert(sub1.domNode.classList.contains("sub1"));
			assert(sub2.classList.contains("sub2"));
		},

		"add a css class with constructor.name on domNode": function(){
			assert(owner.domNode.classList.contains("DomComponent"));
		},

		"Place component tree": function() {
			owner._placement.set([
				sub1,
				['sub2', [
					'subSub1',
					'subSub2'
				]]
			]);
			assert(owner.domNode.contains(sub1.domNode), "sub1 in root");
			assert(owner.domNode.contains(sub2), "sub2 in root");
			assert(sub2.contains(subSub1.domNode), "subSub1 in sub2");
			assert(sub2.contains(subSub2), "subSub2 in sub2");

		},
	});
});
