define([
	'dojo/_base/declare',
	'dojo/dom-construct',
	'./Component'
], function(
	declare,
	domConstruct,
	Component
) {
	/*
	 * Component using a DOM-node as view
	 */
	var DomComponent = declare([Component], {
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
			this.domNode = domConstruct.create(this.domTag, this.domAttrs);
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
		_placeComponent: function(component, options) {
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
		 * Place sub-components in bulk
		 */
		_placeComponents: function(components, options) {
			components.forEach(function(component) {
				this._placeComponent(component);
			}.bind(this));
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
		_unplaceComponent: function(component) {
			if (this.domNode) {
				component = this._getComponent(component);
				this._detachComponentFromDom(component);
				this._setComponentInDom(component, false);
				
				// remove from _placedComponents
				var index = this._placedComponents.indexOf(component);
				this._placedComponents.splice(index, 1);
			}
		},
		
		/*
		 * Unplace several sub-components
		 */
		_unplaceComponents: function(components, options) {
			components.forEach(function(component) {
				this._unplaceComponent(component);
			}.bind(this));
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
						this._placeComponent.apply(this, args);
					}.bind(this));
					this._placeCallsOrder = [];
				}
				// Inform subcomponents of the new state
				for (var c in this._placedComponents) {
					this._setComponentInDom(this._placedComponents[c], value);
				}
			}
		},
		
		_deleteComponent: function (component) {
			this._unplaceComponent(component);
			this.inherited(arguments);
		}

	});
	return DomComponent;
});
