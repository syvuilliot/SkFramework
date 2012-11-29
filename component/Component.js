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
			this._bindings = {};
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

		/*
		 * Register sub-components
		 */
		_addComponent: function(component, id){
			//TODO: generate an id if none is provided
			this._components[id] = component;
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
		_addComponents: function(components) {
			Object.keys(components).forEach(function(id){
				this._addComponent(this._buildComponent(components[id]), id);
			}.bind(this));
		},
		
		/*
		 * Create bindings with a subcomponent
		 * 
		 * @param {Component} component
		 * @param {Array} bindings	Binding handlers
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
		 * Create bindings with several subcomponents
		 * 
		 * @param {Object} bindings	Binding handlers indexed by subcomponent's id
		 */
		_bindComponents: function(bindings) {
			for (var id in bindings) {
				this._bindComponent(id, bindings[id]);
			}
		},
		
		_unbindComponent: function(component) {
			var id = this._getComponentId(component);
			array.forEach(this._bindings[id], function(handle) {
				handle.remove();
			});
			delete this._bindings[id];
		},
		
		/*
		 * Get a subcomponent's id from its id or itself
		 * 
		 * @param {String|Component} arg
		 * @return {String} Id of subcomponent
		 */
		_getComponentId: function(arg) {
			if (lang.isString(arg) && this._components.hasOwnProperty(arg)) {
				return arg;
			} else {
				for (var c in this._components) {
					if (this._components[c] === arg) {
						return c;
					}
				}
			}
			console.warn('Unknown component or id:', arg);
		},
		
		/*
		 * Get a subcomponent from its id
		 * (argument can be a component instance, in which case check if is subcomponent and return it)
		 * 
		 * @param {String|Component} arg
		 * @return {Component|undefined} Subcomponent
		 */
		_getComponent: function(arg) {
			var id = this._getComponentId(arg);
			if (id) {
				return this._components[id];
			}
		},
		_destroyComponent: function(component) {
			if (component instanceof Component) {
				component.destroy();
			}
		},
		/*
		 * Delete a subcomponent
		 * 
		 * @param {String|Component} arg
		 */
		_deleteComponent: function (arg) {
			var id = this._getComponentId(arg);
			this._unbindComponent(id);
			this._destroyComponent(id);
			delete this._components[id];
		},
		
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
