define([
	'teststack!object',	'teststack/chai!assert',
	'../DomComponent'
], function(
	registerSuite,		assert,
	Dom
) {
	"strict mode";
	
	var owner, domNode, sub1, sub2, subSub1, subSub2;
	registerSuite({
		name: "DOM components",
		beforeEach: function() {
			owner = new Dom();
			sub1 = new Dom();
			sub2 = new Dom();
			subSub1 = new Dom('span');
			subSub2 = new Dom({tag: 'span'});
			owner._addComponents({
				sub1: sub1,
				sub2: sub2,
				subSub1: subSub1,
				subSub2: subSub2
			});
		},
		
		"DOM node creation": function() {
			assert.equal(owner.domNode.tagName, 'DIV', "Default tag name is 'div'");
			assert.equal(subSub1.domNode.tagName, 'SPAN', "Tag name passed as single constructor arg");
			assert.equal(subSub2.domNode.tagName, 'SPAN', "Tag name passed in constructor params");
		},

		"place single component": function() {
			owner._place(sub1, owner.domNode);
			assert(owner.domNode.contains(sub1.domNode), "sub1 in domNode");
			owner._unplace(sub1);
			assert.isFalse(owner.domNode.contains(sub1.domNode), "sub1 no more in domNode");
		},
		
		"place single component by id": function() {
			owner._place('sub1', 'domNode');
			assert(owner.domNode.contains(sub1.domNode), "sub1 in domNode");
			owner._unplace('sub1');
			assert.isFalse(owner.domNode.contains(sub1.domNode), "sub1 no more in domNode");
		},

		"place multiple components": function() {
			owner._place([sub1, 'sub2'], 'domNode');
			assert.equal(owner.domNode.children[0], sub1.domNode, "sub1 in domNode in 1st place");
			assert.equal(owner.domNode.children[1], sub2.domNode, "sub2 in domNode in 2nd place");
			owner._unplace(sub1);
			assert.isFalse(owner.domNode.contains(sub1.domNode), "sub1 no more in domNode");
			assert(owner.domNode.contains(sub2.domNode), "sub2 still in domNode");
			owner._unplace(sub2);
			assert.isFalse(owner.domNode.contains(sub2.domNode), "sub2 no more in domNode");
		},
		
		"place component tree": function() {
			owner._place([sub1, [subSub1, subSub2]], 'domNode');
			assert(owner.domNode.contains(sub1.domNode), "place component tree");
			assert(sub1.domNode.contains(subSub1.domNode), "place component tree");
			assert(sub1.domNode.contains(subSub2.domNode), "place component tree");
		}
	});
});
