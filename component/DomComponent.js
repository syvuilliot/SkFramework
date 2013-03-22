define([
	'dojo/_base/declare',
	'dojo/dom',	'dojo/dom-construct',	'put-selector/put',
	'./Component',	'./_LazyFactory',	'./_Placing',	'./_WithDomNode'
], function(
	declare,
	dom,		domConstruct,			put,
	Component,		_LazyFactory,		_Placing,		_WithDomNode
) {
	var isDomCmp = function(cmp) {
		return cmp instanceof DomComponent;
	};

	/*
	 * Component using a DOM-node as view
	 */
	var DomComponent = declare([Component, _LazyFactory, _Placing, _WithDomNode], {
		/*
		 * Default values for constructor params
		 */
		_defaultTag: "div",
		
		constructor: function(params) {
			var domNode = params && params.domNode,
				tag;
			if (domNode) {
				this._addComponent(domNode, 'domNode');
				if (this._domNode.parentNode) {
					this._inDom = true;
				}
			} else {
				// determine tag name
				if (params) {
					if (typeof params === 'string') {
						tag = params;
					} else {
						tag = params.tag;
					}
				} else {
					tag = this._defaultTag;
				}
				// declare node factory
				this._addComponentFactory('domNode', function() {
					return put(tag);
				});
			} 
		},

		_doPlaceComponent: function(component, container, options) {
			var cmpIsDom = isDomCmp(component),
				cntIsDom = isDomCmp(container);
			if (cmpIsDom || cntIsDom) {
				// use implementations for DOM nodes
				return this._doPlaceComponent(
					cmpIsDom ? component.domNode : component,
					cntIsDom ? container.domNode : container,
					options);
			} else {
				return this.inherited(arguments);
			}
		},

		_doUnplaceComponent: function(component, container) {
			if (isDomCmp(component)) {
				// use implementations for DOM nodes
				return this._doUnplaceComponent(component.domNode, container);
			} else {
				return this.inherited(arguments);
			}
		},

		
	});

	Object.defineProperty(DomComponent.prototype, 'domNode', {
		get: function(){
			var domNode = this._getComponent('domNode');
			if (!domNode) {
				domNode = this._addComponent('domNode');
			}
			return domNode;
		}
	});
	return DomComponent;
});