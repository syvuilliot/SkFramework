define([
	'dojo/_base/declare',
	'dojo/dom-construct',
    '../utils/string'
], function(
	declare,
	domConstruct,
	str
) {
	/*
	 * Mixin adding support for DOM-nodes as sub-components
	 */
	var isDomNode = function(component) {
		return component instanceof HTMLElement;
	};
	
	return declare([], {
		_doPlaceComponent: function(node, containerNode, options) {
			if (isDomNode(node) && isDomNode(containerNode)) {
				domConstruct.place(node, containerNode, options);
				return true;
			} else {
				return this.inherited(arguments);
			}
		},
		
		_doUnplaceComponent: function (node, containerNode) {
			if (isDomNode(node) && isDomNode(containerNode)) {
				try {
					containerNode.removeChild(node);
				}
				catch(NotFoundError) {
					console.warn('Tried to remove a node not present in parent');
				}
				return true;
			} else {
				return this.inherited(arguments);
			}
		}
	});
});
