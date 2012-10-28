define([
	'dojo/_base/declare',
	'dojo/dom-construct'
], function(
	declare,
	domConstruct
) {
	/*
	 * Mixin adding support of DOM-nodes as sub-components
	 */
	return declare([], {
		_placeComponent: function(component, option) {
			if (component instanceof HTMLElement) {
				domConstruct.place(component, this.domNode, option);
			}
			else {
				this.inherited(arguments);
			}
		},
		
		_unplaceComponent: function (component) {
			if (component instanceof HTMLElement) {
				this.domNode.removeChild(component); //this method doen't seem to exist in domConstruct
			} else {
				this.inherited(arguments);
			}
		}
	});
});
