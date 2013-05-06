define([
	'intern!object',	'intern/chai!assert',
	'dojo/_base/declare',	'dojo/dom-style',
	'../FlexContainer'
], function(
	registerSuite,		assert,
	declare,				style,
	FlexContainer
) {
	"strict mode";
	
	var container, content, panel;

	registerSuite({
		name: "Flex container",
		beforeEach: function() {
			content = document.createElement('div');
			content.innerHTML = "Flex";
			panel = document.createElement('div');
			panel.innerHTML = "Fixed";

			container = new FlexContainer();

			window.onresize = function() {
				container.height = window.innerHeight - style.get(document.body, 'marginTop') - style.get(document.body, 'marginBottom');
				container.layout();
			}
		},

		"main tests": function() {
			container.put(content, "flex");
			container.put(panel, 200);
			document.body.appendChild(container.root);
			container.height = 300;
			assert.equal(style.get(panel, 'height'), 200);
			assert.equal(style.get(content, 'height'), 100);
			container.height = 500;
			assert.equal(style.get(content, 'height'), 300);
			container.set(panel, 100);
			assert.equal(style.get(panel, 'height'), 100);
		}
	});
});
