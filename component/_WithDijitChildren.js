define([
	'dojo/_base/declare',
	'dojo/dom-construct'
], function(
	declare,
	dom
) {
	/*
	 * Mixin adding support of Dijits (dojo) as children
	 */
	return declare([], {
		_placeChild: function(component, position) {
			var containerNode = this.containerNode || this.domNode;
			if (component.domNode && component.startup) {
				dom.place(component.domNode, containerNode, position);
				component.startup();
			}
			else {
				this.inherited(arguments);
			}
		},
		
		_unplace: function (component) {
			if (component.domNode) {
				this.domNode.removeChild(component.domNode); //this method doesn't seem to exist in domConstruct
			} else {
				this.inherited(arguments);
			}
		}
	});
});
