define([
	'dojo/_base/declare'
], function(
	declare
) {
	/*
	 * Mixin adding placement API for Component
	 */
	return declare([], {
		constructor: function() {
			this._placement = [];
		},
		
		/*
		 * Get index of placement
		 * 
		 * @param {Component}	component	Component
		 */
		_placeIndex: function(component) {
			return this._placement.indexOf(component);
		},
		
		/*
		 * Placing implementation
		 * 
		 * @param {Component|String}	component	Component or id
		 * @param {String|Object}		options		Placement options
		 */
		_doPlaceComponent: function(component, options) {
			// To be implemented in subclasses
		},
		
		/*
		 * Place a subcomponent
		 * 
		 * @param {Component|String}	component			Component or id
		 * @param {String|Object}		[options="last"]	Placement options
		 */
		_placeComponent: function(component, options) {
			options = (options === undefined) ? 'last' : options;
			var comp = this._getComponent(component);
			if (comp) {
				var index = this._placeIndex(comp);
				if (index > -1) {
					// Component already placed, remove it from array
					this._placement.splice(index, 1);
				}
				if (options == 'last') {
					this._placement.push(comp);
				} else {
					// options should be an index
					this._placement.splice(options, 0, comp);
				}
				this._doPlaceComponent(comp, options);
			}
		},
		
		/*
		 * Place several subcomponents
		 * 
		 * @param {Array}			components			List of Component objects and/or ids
		 * @param {String|Object}	[options="last"]	Placement options
		 */
		_placeComponents: function(components, options) {
			for (var c in components) {
				this._placeComponent(components[c], options);
			}
		},
		
		/*
		 * Unplacing implementation
		 * 
		 * @param {Component|String}	component			Component or id
		 */
		_doUnplaceComponent: function(component) {
			// To be implemented in subclasses
		},
		
		/*
		 * Unplace a subcomponent
		 * 
		 * @param {Component|String}	component	Component or id
		 */
		_unplaceComponent: function(component) {
			var comp = this._getComponent(component);
			if (comp) {
				// remove from _placement
				var index = this._placeIndex(comp);
				if (index > -1) {
					this._placement.splice(index, 1);
					this._doUnplaceComponent(comp);
				}
			}
		},
		
		/*
		 * Unplace several subcomponents
		 * 
		 * @param {Array}			components			List of Component objects and/or ids
		 */
		_unplaceComponents: function(components) {
			for (var c in components) {
				this._unplaceComponent(components[c]);
			}
		},
		
		_deleteComponent: function(component) {
			this._unplaceComponent(component);
			this.inherited(arguments);
		}
	});
});
