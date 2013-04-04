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

			owner._components.addEachComponentFactory({
				sub1: function() { return new DomComponent(); },
				sub2: function() { return new DomComponent(); },
				subSub1: function() { return document.createElement('div'); },
				subSub2: function() { return document.createElement('div'); }
			});

			sub1 = owner._components.create('sub1');
			sub2 = owner._components.create('sub2');
			subSub1 = owner._components.create('subSub1');
			subSub2 = owner._components.create('subSub2');
		},
		
		"DOM-node creation": function() {
			assert.equal(owner.domNode.tagName, 'DIV', "Tag name is 'div'");
		},
		
		"Place component tree": function() {
			owner._place([
				sub1,
				['sub2', [
					'subSub1',
					'subSub2'
				]]
			]);
			assert(owner.domNode.contains(sub1.domNode), "sub1 in root");
			assert(owner.domNode.contains(sub2.domNode), "sub2 in root");
			assert(sub2.domNode.contains(subSub1), "subSub1 in sub2");
			assert(sub2.domNode.contains(subSub2), "subSub2 in sub2");
		}
	});
});
