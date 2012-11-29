define([
	'dojo/_base/declare',
	'dojo/dom-construct'
], function(
	declare,
	domConstruct
) {
	/*
	 * Mixin adding support for DOM-nodes as sub-components
	 */
	var isDomNode = function(component) {
		return component instanceof HTMLElement;
	};
	
	return declare([], {
		_insertComponentIntoDom: function(component, option) {
			if (isDomNode(component)) {
				domConstruct.place(component, this.domNode, option);
			} else {
				this.inherited(arguments);
			}
		},
		
		_detachComponentFromDom: function (component) {
			if (isDomNode(component)) {
				try {
					this.domNode.removeChild(component);
				}
				catch(NotFoundError) {
					console.warn('Tried to remove a node not present in parent');
				}
			} else {
				this.inherited(arguments);
			}
		}
	});
});
