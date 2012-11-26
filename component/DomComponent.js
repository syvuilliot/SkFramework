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
			this._render();
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
		 * Places sub-components' views in its own view (DOM-node)
		 */
		_placeComponent: function(component, options) {
			if (this._placed) {
				if (component instanceof DomComponent) {
					domConstruct.place(component.render(), this.domNode, "last");
					component.isPlaced();
				}
			}
			else {
				this._placeCallsOrder.push(arguments);	
			}
		},
		_unplaceComponent: function (component) {
			if (component instanceof DomComponent) {
				this.domNode.removeChild(component.domNode); //this method doesn't seem to exist in domConstruct
			}
		},

		_placed: false,
		isPlaced: function() {
			if (!this._placed) {
				this._placed = true;
				this._placeCallsOrder.forEach(function(args) {
					this._placeComponent.apply(this, args);
				}.bind(this));
			}
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
