define([
	'dojo/_base/declare',
	'dojo/dom-construct',
	'put-selector/put',
	'./Component',	'./_Placing'
], function(
	declare,
	domConstruct,
	put,
	Component,		_Placing
) {
	/*
	 * Component using a DOM-node as view
	 */
	var DomComponent = declare([Component, _Placing], {
		domNode: null,
		domTag: "div",
		domAttrs: null,

		constructor: function() {
			this._placedComponents = [];
			this._placeCallsOrder = [];
		},

		render: function() {
			if (!this.domNode) {
				this._render();
			}
			return this.domNode;
		},

		_render: function() {
			// this.domNode = domConstruct.create(this.domTag, this.domAttrs);
			this.domNode = this.domAttrs ? put(this.domTag, this.domAttrs) : put(this.domTag);
		},

		/*
		 * Insert component's view into its own DOM-node
		 */
		_insertComponentIntoDom: function(component, options) {
			if (component instanceof DomComponent) {
				domConstruct.place(component.render(), this.domNode, options);
			}
		},

		_setComponentInDom: function(component, value) {
			if (component instanceof DomComponent) {
				component.set('inDom', value);
			}
		},

		/*
		 * Place sub-components' views in its own view
		 * 
		 * @param {String|Component} component Component instance or id
		 * @param options: placement options (to be defined)
		 */
		_doPlaceComponent: function(component, options) {
			if (this.inDom) {
				component = this._getComponent(component);
				this._insertComponentIntoDom(component, options);
				this._setComponentInDom(component, true);
				this._placedComponents.push(component);
			}
			else {
				this._placeCallsOrder.push(arguments);
			}
		},

		/*
		 * Detach component's view from its own DOM-node
		 */
		_detachComponentFromDom: function (component) {
			if (component instanceof DomComponent) {
				this.domNode.removeChild(component.domNode);
			}
		},

		/*
		 * Unplace sub-components' views from its own view
		 * 
		 * - component: component instance or name
		 */
		_doUnplaceComponent: function(component) {
			if (this.domNode) {
				component = this._getComponent(component);
				this._detachComponentFromDom(component);
				this._setComponentInDom(component, false);

				// remove from _placedComponents
				var index = this._placedComponents.indexOf(component);
				this._placedComponents.splice(index, 1);
			}
		},

		inDom: false,
		_inDomSetter: function(value) {
			if (value === undefined) {
				value = true;
			};
			if (value != this.inDom) {
				this.inDom = value;
				if (value) {
					// this component has been inserted in DOM document
					// insert its children for real now
					this._placeCallsOrder.forEach(function(args) {
						this._doPlaceComponent.apply(this, args);
					}.bind(this));
					this._placeCallsOrder = [];
				}
				// Inform subcomponents of the new state
				for (var c in this._placedComponents) {
					this._setComponentInDom(this._placedComponents[c], value);
				}
			}
		}
	});
	return DomComponent;
});
