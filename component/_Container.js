define([
	'dojo/_base/declare',
	'dojo/dom-construct',
], function(
	declare,
	domConstruct
) {
	//mixin to expose public methods to add and remove children (===contained components)
	return declare([], {
		constructor: function(){
			this.children = [];
		},

		addChild: function(component, position){
			//register child
			this.children.push(component);
			//place it
			this._placeChild(component, position);
			return this;
		},
		removeChild: function (component) {
			//unplace child (remove it from this view)
			this._unplaceChild(component);
			//unregister child
			var index = this.children.indexOf(component);
			this.children.splice(index, 1);
		},
		addChildren: function(components) {
			components.forEach(function(component){
				this.addChild(component);
			}.bind(this));
			return this;
		},

		//default implementation for SkComponents and domNodes
		//to be extended/overridden by subclasses
		//by default a child is appended the same way as a sub component (so it benefits from mixin placement logic)
		_placeChild: function(component, position){
			this._placeComponent(component, position);
		},
		_unplaceChild: function (component) {
			this._unplaceComponent(component);
		},

	});
});
