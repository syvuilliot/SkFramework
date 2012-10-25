define([
	'dojo/_base/declare',
	'dojo/dom-construct'
], function(
	declare,
	dom
) {
	/*
	 * Mixin adding support of Dijits (dojo) as sub-components
	 */
	return declare([], {
		_append: function(component, option) {
			if (component.domNode && component.startup) {
				dom.place(component.domNode, this.domNode, option);
				component.startup();
			}
			else {
				this.inherited(arguments);
			}
		},
		
		_remove: function (component) {
			if (component.domNode) {
				this.domNode.removeChild(component.domNode); //this method doesn't seem to exist in domConstruct
			} else {
				this.inherited(arguments);
			}
		}
	});
});
