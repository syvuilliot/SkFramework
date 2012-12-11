define([
	'lodash/lodash',
	'dojo/_base/declare',	'dojo/_base/lang',	'dojo/_base/array',
	'dojo/Stateful',	'dojo/Evented',	'dijit/Destroyable'
], function(_,
	declare,				lang,				array,
	Stateful,			Evented,		Destroyable
) {
	var Component = declare([Stateful, Evented, Destroyable], {
		constructor: function(){
			this._presenter = new Stateful();
			this._components = {};
			this._hardRefs = {};
			this._bindings = {};
			this._placement = [];
		},

		get: function(prop) {
			if (prop in this) {
				return this.inherited(arguments);
			} else {
				return this._presenter.get.apply(this._presenter, arguments);
			}
		},

		set: function(prop, value) {
			if (prop instanceof Object || prop in this) {
				return this.inherited(arguments);
			} else {
				return this._presenter.set(prop, value);
			}
		},

		/*
		 * Build a component from a configuration object
		 *
		 * configObject: can be one of the following:
		 * 	- Class of component
		 *  - {
		 * 		constructor: Class,
		 * 		classOption1: ...,
		 * 		classOption2: ...,
		 * 		...
		 *    }
		 * 	- instance of component (return as is)
		 */
		_buildComponent: function(configObject, options) {
			if (configObject instanceof Function) {
				// configObject is a class
				return new configObject(options);
			}
			if (_.isPlainObject(configObject)) {
				var configOptions = lang.mixin({}, configObject);
				delete configOptions.constructor;

				return new configObject.constructor(lang.mixin(configOptions, options));
			}
			else {
				// configObject is an instance
				return configObject;
			}
		},

		generateId: function() {
			return "comp"+(Math.floor(Math.random() * 1000000)).toString();
		},

		/*
		 * Get a subcomponent's id
		 *
		 * @param {Component|String}	component	Component or id
		 * @return {String} Id of subcomponent
		 */
		_getComponentId: function(component) {
			if (lang.isString(component) && this._components.hasOwnProperty(component)) {
				return component;
			} else {
				for (var id in this._components) {
					if (this._components[id] === component) {
						return id;
					}
				}
			}
			console.warn('Unknown component or id:', component);
		},

		/*
		 * Get a subcomponent from its id
		 * (argument can be a component instance, in which case check if is subcomponent and return it)
		 *
		 * @param {Component|String}	component	Component or id
		 * @return {Component|undefined} Subcomponent
		 */
		_getComponent: function(component) {
			var id = this._getComponentId(component);
			if (id) {
				return this._components[id];
			}
		},
		
		/*
		 * Register sub-components
		 * 
		 * @param {Component}	component	Subcomponent to be added
		 * @param {String}		[id]		Id of component
		 * @param {Object}		[options]
		 * 		Registering options:
		 * 			- noHardRef: prevent creation of a private attribute for quick access to the subcomponent (ex: this._sub1)
		 */
		_addComponent: function(component, id, options){
			id = id || this.generateId();
			this._components[id] = component;
			
			if (!options || !options.noHardRef) {
				var ref = '_' + id;
				if (this[ref] === undefined) {
					this[ref] = component;
					this._hardRefs[id] = ref;
				}
			}
			
			return component;
		},

		/*
		 * Add several components at once
		 *
		 *  - components: {
		 * 		id1: configObject1,
		 * 		id2: configObject2,
		 * 		...
		 * 	  }
		 */
		_addComponents: function(components, options) {
			Object.keys(components).forEach(function(id){
				this._addComponent(this._buildComponent(components[id]), id);
			}.bind(this));
		},

		/*
		 * Register binding handlers for a subcomponent that  will be canceled when deleting the subcomponent
		 *
		 * @param {Component|String}	component	Component or id
		 * @param {Array}				bindings	Binding handlers
		 */
		_bindComponent: function(component, bindings) {
			var id = this._getComponentId(component);
			if (id) {
				if (!lang.isArray(bindings)) {
					bindings = [bindings];
				}
				this._bindings[id] = this.own.apply(this, bindings);
			}
		},
		/*
		 * Register bindings for several subcomponents
		 *
		 * @param {Object}	bindings	Binding handlers indexed by subcomponent's id
		 */
		_bindComponents: function(bindings) {
			for (var id in bindings) {
				this._bindComponent(id, bindings[id]);
			}
		},

		/*
		 * Remove bindings of a subcomponent
		 *
		 * @param {Component|String}	component	Component or id
		 */
		_unbindComponent: function(component) {
			var id = this._getComponentId(component);
			array.forEach(this._bindings[id], function(handle) {
				handle.remove();
			});
			delete this._bindings[id];
		},
		
		/*
		 * Placing implementation to be overriden by subclasses
		 * 
		 * @param {Component|String}	component			Component or id
		 * @param {String|Object}		[options="last"]	Placement options
		 */
		_insertComponent: function(component, options) {
			// To be implemented in subclasses
		},
		
		/*
		 * Place a subcomponent
		 * 
		 * @param {Component|String}	component			Component or id
		 * @param {String|Object}		[options="last"]	Placement options
		 */
		_placeComponent: function(component, options) {
			options = options || 'last';
			var comp = this._getComponent(component);
			if (comp) {
				this._insertComponent(comp);
				this._placement.push(comp);
			}
		},
		
		/*
		 * Place several subcomponents
		 * 
		 * @param {Array}			components			List of Component objects and/or ids
		 * @param {String|Object}	[options="last"]	Placement options
		 */
		_placeComponents: function(components, options) {
			options = options || 'last';
			for (var c in components) {
				this._placeComponent(components[c], options);
			}
		},
		
		/*
		 * Unplacing implementation to be overriden by subclasses
		 * 
		 * @param {Component|String}	component			Component or id
		 */
		_detachComponent: function(component) {
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
				var index = this._placement.indexOf(comp);
				if (index > -1) {
					this._detachComponent(comp);
					this._placement.splice(index, 1);
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
		
		/*
		 * Destroy a subcomponent
		 * 
		 * @param {Component|String}	component	Component or id
		 */
		_destroyComponent: function(component) {
			var comp = this._getComponent(component);
			if (component instanceof Component) {
				component.destroy();
			}
		},
		/*
		 * Delete a subcomponent
		 *
		 * @param {Component|String}	component	Component or id
		 */
		_deleteComponent: function (component) {
			var id = this._getComponentId(component);
			this._unbindComponent(id);
			this._unplaceComponent(id);
			this._destroyComponent(id);
			delete this._components[id];
			if (id in this._hardRefs) {
				delete this[this._hardRefs[id]];
			}
		},
		/*
		 * Delete several subcomponents
		 *
		 * @param {Array}	components	Array of components objects
		 */
		_deleteComponents: function (components) {
			components.forEach(function(comp) {
				this._deleteComponent(comp);
			}.bind(this));
		},
		
		/*
		 * Destroy itself and its subcomponents
		 */
		destroy: function () {
			//unregister every component and call destroy on them if available
			_(this._components).forEach(function(component, id){
				this._deleteComponent(id);
			}.bind(this));
			this.inherited(arguments);
		}
	});
	return Component;
});
