define([
	'lodash/lodash',
	'dojo/_base/declare',	'dojo/_base/lang',	'dojo/_base/array',
	'dojo/Stateful',	'dojo/Evented',	'dijit/Destroyable'
], function(_,
	declare,				lang,				array,
	Stateful,			Evented,		Destroyable
) {
	function isComponent(component) {
		return component instanceof Component;
	}
	
	var Component = declare([Stateful, Evented, Destroyable], {
		_presenter: function() {
			return new Stateful();
		},
		
		/*
		 * Components definitions
		 */
		_components: {},
		_bindings: {},
		
		constructor: function(params) {
			this._presenter = this._getFactoryResult(this._presenter);
			
			// Sets constructor params right now, not in postcript()
			if (params) { this.set(params); }
			
			this._registeredComponents = {};
			this._registeredBindings = {};
			this._hardRefs = {};
		},
		
		postscript: function() {
			// Don't do anything, constructor params are already set
		},
		
		/*
		 * 
		 */
		_getFactoryResult: function(factory) {
			if (factory instanceof Function) {
				return factory.bind(this)();
			}
			return factory;
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

		watch: function(prop, handler) {
			// if only one argument (no prop specified) apply watch on this and not on _presenter
			if (prop in this || !arguments[1]) {
				return this.inherited(arguments);
			} else {
				return this._presenter.watch.apply(this._presenter, arguments);
			}
		},
		
		/*
		 * Check whether a component is supported as a sub-component
		 * 
		 * @param {Object}	component	Component instance
		 * @return {Boolean}	True if supported, False otherwise
		 */
		_isComponentSupported: function(component) {
			return isComponent(component);
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
			var id, cmp;
			if (lang.isString(component)) {
				// argument is an id
				if (this._registeredComponents.hasOwnProperty(component)) {
					// a component is registered with this id
					id = component;
				} else {
					// no component registered with this id,
					// see if _addComponent() returns anything
					cmp = this._addComponent(component);
					if (cmp) {
						id = component;
					}
				}
				return id;
			} else {
				for (id in this._registeredComponents) {
					if (this._registeredComponents[id] === component) {
						return id;
					}
				}
				console.warn('Unknown component', component);
			}
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
				return this._registeredComponents[id];
			}
		},
		
		/*
		 * Get a list of subcomponents
		 * 
		 * @param {Array}	components	List of component instances or ids
		 * @return {Array}	List of subcomponent instances
		 */
		_getComponents: function(components) {
			var result = [];
			for (var c in components) {
				var cmp = this._getComponent(components[c]);
				if (cmp) {
					result.push(cmp);
				}
			}
			return result;
		},

		/*
		 * Register sub-components
		 *
		 * @param {Component|Function} component	Component instance to be added. Can also be a function returning a component instance.
		 * @param {String}		[id]		Id of component
		 * @param {Object}		[options]
		 * 		Registering options:
		 * 			- noHardRef: prevent creation of a private attribute for quick access to the subcomponent (ex: this._sub1)
		 */
		_addComponent: function(component, id, options) {
			if (lang.isString(component)) {
				// argument is supposed to be an id, check if defined in _components
				if (this._components.hasOwnProperty(component)) {
					return this._addComponent(this._components[component], component);
				} else {
					console.warn('Unknown id', component);
					return;
				}
			}
			
			component = this._getFactoryResult(component);
			if (!this._isComponentSupported(component)) {
				console.warn("Unsupported component", component);
			}

			if (id && (!options || !options.noHardRef)) {
				var ref = '_' + id;
				if (this[ref] === undefined) {
					this[ref] = component;
					this._hardRefs[id] = ref;
				}
			}
			
			id = id || this.generateId();
			this._registeredComponents[id] = component;
			
			// if a binding has been declared for this component, enable it
			if (this._bindings.hasOwnProperty(id)) {
				this._bindComponent(component, this._bindings[id]);
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
				this._addComponent(components[id], id);
			}.bind(this));
		},
		
		/*
		 * Register binding handlers for a subcomponent that will be canceled when deleting the subcomponent
		 *
		 * @param {Component|String}	component	Component or id
		 * @param {Array}				bindings	Binding handlers
		 * @param {String}				[name]		Name of binding, useful for future reference
		 */
		_bindComponent: function(component, bindings, name) {
			var id = this._getComponentId(component);
			if (id) {
				bindings = this._getFactoryResult(bindings);
				if (!lang.isArray(bindings)) {
					bindings = [bindings];
				}
				if (!this._registeredBindings.hasOwnProperty(id)) {
					this._registeredBindings[id] = {};
				}
				this._registeredBindings[id][name] = this.own.apply(this, bindings);
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
		 * @param {String}				[name]		Name of binding to remove
		 */
		_unbindComponent: function(component, name) {
			var id = this._getComponentId(component),
				bindings = this._registeredBindings[id] && this._registeredBindings[id][name];

			array.forEach(bindings, function(handle) {
				handle.remove();
			});
			if (name) {
				if (this._registeredBindings[id]) {
					delete this._registeredBindings[id][name];
				}
			} else {
				delete this._registeredBindings[id];
			}
		},

		/*
		 * Destroy a subcomponent
		 *
		 * @param {Component|String}	component	Component
		 */
		_destroyComponent: function(component) {
			if (isComponent(component)) {
				component.destroy();
			}
		},
		
		_unregisterComponent: function(id) {
			delete this._registeredComponents[id];
			if (id in this._hardRefs) {
				delete this[this._hardRefs[id]];
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
			var comp = this._getComponent(id);
			this._destroyComponent(comp);
			this._unregisterComponent(id);
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
			_(this._registeredComponents).forEach(function(component, id){
				this._deleteComponent(id);
			}.bind(this));
			this.inherited(arguments);
		}
	});
	return Component;
});
