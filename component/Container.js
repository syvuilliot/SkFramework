define([
	'dojo/_base/declare',
	'./DomComponent'
], function(
	declare,
	DomComponent
) {
	/*
	 * Component with public methods to add and remove children (contained components)
	 */
	return declare([DomComponent], {
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
			return this;
		},
		addChildren: function(components) {
			components.forEach(function(component){
				this.addChild(component);
			}.bind(this));
			return this;
		},
		removeChildren: function(components) {
			components.forEach(function(component){
				this.removeChild(component);
			}.bind(this));
			return this;
		},
		
		removeAllChildren: function() {
			return this.removeChildren(this.children.slice());
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
		
		_getComponent: function(arg) {
			// Override to retrieve registered children also
			if (this.children.indexOf(arg) > -1) {
				return arg;
			} else {
				return this.inherited(arguments);
			}
		}
	});
});
