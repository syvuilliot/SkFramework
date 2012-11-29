define([
	'dojo/_base/declare',
	'dojo/dom-construct'
], function(
	declare,
	dom
) {
	/*
	 * Mixin adding support for Dijits (dojo) as sub-components
	 */
	var isDijit = function(component) {
		return component && component.domNode && component.startup;
	};
	
	return declare([], {
		_insertComponentIntoDom: function(component, option) {
			if (isDijit(component)) {
				dom.place(component.domNode, this.domNode, option);
			}
			else {
				this.inherited(arguments);
			}
		},
		
		_detachComponentFromDom: function (component) {
			if (isDijit(component)) {
				this.domNode.removeChild(component.domNode);
			} else {
				this.inherited(arguments);
			}
		},
		
		_setComponentInDom: function (component, value) {
			if (isDijit(component)) {
				if (value) {
					component.startup();
				} else {
					component._started = false;
				}
			} else {
				this.inherited(arguments);
			}
		},
		
		_destroyComponent: function (component) {
			if (isDijit(component)) {
				component.destroy();
			} else {
				this.inherited(arguments);
			}
		}
	});
});
