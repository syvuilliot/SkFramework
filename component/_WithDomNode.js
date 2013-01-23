define([
	'dojo/_base/declare',
	'dojo/dom-construct',
	'put-selector/put',
    '../utils/string'
], function(
	declare,
	domConstruct,
	put,
	str
) {
	/*
	 * Mixin adding support for DOM-nodes as sub-components
	 */
	var isDomNode = function(component) {
		return component instanceof HTMLElement;
	};
	
	return declare([], {
		_isComponentSupported: function(component) {
			if (isDomNode(component)) {
				return true;
			}
			return this.inherited(arguments);
		},
		
	    _addComponent: function(cmp, id) {
            var cmp = this.inherited(arguments);
            if (isDomNode(cmp)) {
                // add CSS class matching the component id, hyphenated
                id && put(cmp, '.' + str.hyphenate(id));
            }
            return cmp;
        },
        
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
