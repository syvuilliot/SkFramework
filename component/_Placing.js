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
		
		
		_getAssembledComponent: function(config) {
			var comp, index, ctnrId, container;
			if (_(config).isPlainObject()) {
				for (ctnrId in config) {
					container = this._getComponent(ctnrId);
					if (container) {
						comp = container.addChildren(this._getAssembledComponents(config[ctnrId]));
					}
					// only one key is consumed, since object configuration is supposed to represent only one container
					break;
				}
			} else {
				comp = this._getComponent(config);
			}
			return comp;
		},
		
		/*
		 * Get a component or list of components with potential children already placed
		 * 
		 * @param {String|Object|Array}	config	Placement configuration
		 */
		_getAssembledComponents: function(config) {
			if (!(config instanceof Array)) {
				return this._getAssembledComponent(config);
			}
			
			var result = [],
				item, i;
			for (i = 0; i < config.length; i++) {
				item = this._getAssembledComponent(config[i]);
				if (item !== undefined) {
					result.push(item);
				}
			}
			return result;
		},
		
		/*
		 * Place a subcomponent
		 * 
		 * @param {Component|String}	component			Component or id
		 * @param {String|Object}		[options="last"]	Placement options
		 */
		_placeComponent: function(component, options) {
			options = (options === undefined) ? 'last' : options;
			var comp = this._getAssembledComponents(component),
				index;
			
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
			var c, item;
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
