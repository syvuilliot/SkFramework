define([
	'lodash/lodash',
	'dojo/_base/declare'
], function(
	_,
	declare
) {
	/*
	 * Mixin adding placement API for Component
	 */
	return declare([], {
		constructor: function() {
			this._placedComponents = [];
		},
		
		/*
		 * Get index of placement
		 * 
		 * @param {Component}	component	Component
		 */
		_placeIndex: function(component) {
			return this._placedComponents.indexOf(component);
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
			var comp,
				index;
			if (_(component).isPlainObject()) {
				for (var ctnrId in component) {
					var container = this._getComponent(ctnrId);
					if (container) {
						comp = container.addChildren(this._getComponents(component[ctnrId]));
					}
					// only one key is consumed, since object configuration is supposed to represent one container
					break;
				}
			} else {
				comp = this._getComponent(component);
			}
			
			if (comp) {
				index = this._placeIndex(comp);
				if (index > -1) {
					// Component already placed, remove it from array
					this._placedComponents.splice(index, 1);
				}
				if (options === 'last') {
					this._placedComponents.push(comp);
				} else {
					// options should be an index
					this._placedComponents.splice(options, 0, comp);
				}
				this._doPlaceComponent(comp, options);
			}
		},

		/*
		 * Place several subcomponents
		 * 
		 * @param {Array}			config				Placement configuration
		 * @param {String|Object}	[options="last"]	Placement options
		 */
		_placeComponents: function(config, options) {
			var c, item, container, ctnrId;
			for (c = 0; c < config.length; c++) {
				item = config[c];
				this._placeComponent(item, options);
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
			var comp = this._getComponent(component),
				index;
			if (comp) {
				index = this._placeIndex(comp);
				if (index > -1) {
					this._doUnplaceComponent(comp);
					// remove from _placedComponents
					this._placedComponents.splice(index, 1);
				}
			}
		},
		
		/*
		 * Unplace several subcomponents
		 * 
		 * @param {Array}			components			List of Component objects and/or ids
		 */
		_unplaceComponents: function(components) {
			var c;
			for (c = 0; c < components.length; c++) {
				this._unplaceComponent(components[c]);
			}
		},
		
		_deleteComponent: function(component) {
			this._unplaceComponent(component);
			this.inherited(arguments);
		}
	});
});
