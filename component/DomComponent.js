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
			this._placeCallsOrder = [];
		},

		postscript: function(params) {
			this.inherited(arguments);
			this._bind();
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
		 * Binding between Presenter and sub components
		 */
		_bind: function() {
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
		 * - component: component instance or name
		 * - options: placement options (to be defined)
		 */
		_placeComponent: function(component, options) {
			if (this.inDom) {
				component = this._getComponent(component);
				this._insertComponentIntoDom(component, options);
				this._setComponentInDom(component, true);
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
				for (var c in this._components) {
					this._setComponentInDom(this._getComponent(c), value);
				}
			}
		},
		
		_removeComponent: function (component) {
			this._unplaceComponent(component);
			this.inherited(arguments);
		},
		
		//do we need to do something "view related" on destroy ?
		//to my mind, it's up to the parent to remove us from its view but we don't have to do it in its place (it could have removing logic that we can't call since we don't know our parent component, only our parent domNode)
		//destroy should only "kill" the component === cancel binding handlers... this is what destroyable already do
/*		destroy: function(){
		}
*/

	});
	return DomComponent;
});
