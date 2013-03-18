define([
	"compose/compose",
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/Evented',
	'dijit/Destroyable',
	"SkFramework/model/Registry",
	"SkFramework/model/_IdMapping",
	"collections/map",
], function(
	compose,
	declare,
	lang,
	array,
	Evented,
	Destroyable,
	Registry,
	_IdMapping,
	Map
) {
	function isComponent(component) {
		return component instanceof Component;
	}


	var Component = declare([Evented, Destroyable], {
		constructor: function(params) {
			if (params) {
				Object.keys(params).forEach(function(key){
					this[key] = params[key];
				}.bind(this));
			}

			// registry of components
			this._componentsRegistry = compose.create(Registry, _IdMapping);
			// registry of bindings for a component
			this._bindingsRegistry = new Map();
			this._hardRefs = {};

		},

		/*
		 * Components definitions
		 */
		_components: {},
		_bindings: {},

		/*
		 *
		 */
		_getFactoryResult: function(factory) {
			if (factory instanceof Function) {
				return factory.bind(this)();
			}
			return factory;
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

		/*
		 * Get a subcomponent's id
		 *
		 * @param {String}	component	Component
		 * @return {String} Id of component
		 */
		_getComponentId: function(component) {
			return this._componentsRegistry.getId(component);
		},

		/*
		 * Get a subcomponent by id
		 * Can be used by other methods to "normalize" the component argument :
		 * if the argument is a registered component it is returned
		 *
		 * @param {String|Component}	component	Component or id
		 * @return {Component|undefined} Subcomponent
		 */
		_getComponent: function(arg) {
			if (typeof arg === "string") {
				return this._componentsRegistry.getById(arg);
			} else {
				return this._hasComponent(arg) ? arg : undefined;
			}
		},
		/*
		 * Check that a component is registered
		 *
		 * @param {Component}	component	Component
		 * @return {Boolean} Has
		 */
		_hasComponent: function(cmp){
			if (typeof cmp === "string") {
				return this._hasComponent(this._getComponent(cmp));
			} else {
				return this._componentsRegistry.has(cmp);
			}
		},



		/*
		 * Add a sub-component
		 *
		 * @param {Component|Function} component	Component instance to be added. Can also be a function returning a component instance. Can also be the id of a declared (but not created) component.
		 * @param {String}		[id]		Id of component
		 * @param {Object}		[options]
		 * 		Registering options:
		 * 			- noHardRef: prevent creation of a private attribute for quick access to the subcomponent (ex: this._sub1)
		 */
		_addComponent: function(component, id, options) {
			// don't add a component twice
			if (this._hasComponent(component)) {
				throw("This component is already registered");
			}
			// declarative mode
			if (typeof component === "string") {
				var name = component;
				// argument is supposed to be an id, check if defined in _components
				if (this._components.hasOwnProperty(name)) {
					return this._addComponent(this._components[name], name);
				} else {
					// TODO: throw an exception instead of a warning ?
					console.warn('No declaration for this component name:', component);
					return;
				}
			}

			component = this._getFactoryResult(component);
			if (!this._isComponentSupported(component)) {
				console.warn("The component", component, "cannot be added because it is not supported by", this);
			}

			this._registerComponent(component, id, options);

			// declarative mode
			// if a binding has been declared for this component, enable it
			if (this._bindings.hasOwnProperty(id)) {
				var bindings = this._getFactoryResult(this._bindings[id]);
				this._registerBindings(component, bindings);
			}

			return component;
		},

		/*
		 * Add several components at once
		 * @param {Object|Array}	components	array or map of components
		 */
		_addComponents: function(components, options) {
			var result;
			if (Array.isArray(components)){
				result = [];
				components.forEach(function(comp){
					result.push(this._addComponent(comp));
				}.bind(this));
			} else {
				result = {};
				Object.keys(components).forEach(function(key){
					result[key] = this._addComponent(components[key], key);
				}.bind(this));
			}
			return result;
		},

		/*
		 * Register binding handlers for a subcomponent that will be canceled when deleting the subcomponent
		 *
		 * @param {Component|String}	component	Component or id
		 * @param {binding|Array}	bindings	One binding or array of bindings
		 * @param {String} name
		 */
		_registerBindings: function(cmp, bindings, name) {
			name = (name === undefined ? "default" : name); // prevent unpredictable behavior
			cmp = this._getComponent(cmp);
			var cmpBindings = this._bindingsRegistry.get(cmp) || new Map();
			var cmpNamedBindings = cmpBindings.get(name) || [];
			if (Array.isArray(bindings)) {
				cmpNamedBindings = cmpNamedBindings.concat(bindings);
			} else {
				cmpNamedBindings.push(bindings);
			}
			cmpBindings.set(name, cmpNamedBindings);
			this._bindingsRegistry.set(cmp, cmpBindings);
		},

		/*
		 * Cancel bindings of a subcomponent
		 *
		 * @param {Component|String}	component	Component or id
		 * @param {String}				[name]		Name of binding set to remove. If none is provided, all bindings will be canceled
		 */
		_unbindComponent: function(cmp, name) {
			cmp = this._getComponent(cmp);
			var cmpBindings = this._bindingsRegistry.get(cmp);
			var bindings = [];
			if (!cmpBindings) return;
			if (name === undefined) { // cancel and remove all bindings for the component
				cmpBindings.forEach(function(bindingSet, name){
					bindings = bindings.concat(bindingSet);
					cmpBindings.delete(name);
				});
			} else { // cancel and remove only the bindings registered with this name
				bindings = bindings.concat(cmpBindings.get(name));
				cmpBindings.delete(name);
			}
			// if there is no more binding for this component remove its entry in the registry
			if (cmpBindings.length === 0) {
				this._bindingsRegistry.delete(cmp);
			}

			bindings.forEach(function(binding){
				if (typeof binding === "function"){
					binding();
				} else {
					binding.remove && binding.remove();
					binding.cancel && binding.cancel();
				}
			});
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

		_registerComponent: function(component, id, options){
			if (id && (!options || !options.noHardRef)) {
				var ref = '_' + id;
				if (this[ref] === undefined) {
					this[ref] = component;
					this._hardRefs[id] = ref;
				}
			}

			this._componentsRegistry.register(component, id);

		},

		_unregisterComponent: function(component) {
			var id = this._getComponentId(component);
			this._componentsRegistry.unregister(component);
			if (id in this._hardRefs) {
				delete this[this._hardRefs[id]];
				delete this._hardRefs[id];
			}
		},

		/*
		 * Delete a subcomponent
		 *
		 * @param {Component|String}	component	Component or id
		 */
		_deleteComponent: function (cmp) {
			cmp = this._getComponent(cmp);
			this._unbindComponent(cmp);
			this._destroyComponent(cmp);
			this._unregisterComponent(cmp);
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
			this._componentsRegistry.forEach(function(cmp){
				this._deleteComponent(cmp);
			}.bind(this));
			this.inherited(arguments);
		}
	});
	return Component;
});
