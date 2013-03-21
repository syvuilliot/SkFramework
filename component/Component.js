define([
	"compose/compose",
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/Evented',
	'dijit/Destroyable',
	"../utils/Registry",
	"../utils/_IdMapping",
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
			// registry of components
			this._componentFactories = {};
			this._componentsRegistry = compose.create(Registry, _IdMapping);
			// registry of bindings for a component
			this._bindingFactories = [];
			this._bindingsRegistry = [];

			this._hardRefs = {};
		},

		_getFactoryResult: function(factory) {
			if (factory instanceof Function) {
				return factory.bind(this)();
			}
			return factory;
		},

		_addComponentFactory: function(name, factory){
			this._componentFactories[name] = factory;
		},
		_addComponentFactories: function(factories){
			Object.keys(factories).forEach(function(name){
				this._addComponentFactory(name, factories[name]);
			}.bind(this));
		},
		_removeComponentFactory: function(name){
			delete this._componentFactories[name];
		},
		_getComponentFactory: function(name){
			return this._componentFactories[name];
		},

		_addBindingFactory: function(factory){
			this._bindingFactories.push(factory);
		},
		_addBindingFactories: function(factories){
			factories.forEach(function(f){
				this._addBindingFactory(f);
			}.bind(this));
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
		 * Get a subcomponent by id or return the provided component if it is registered (undefined otherwise)
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
				return this._componentsRegistry.has(arg) ? arg : undefined;
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
			if (this._getComponent(component)) {
				throw("This component is already registered");
			}
			// declarative mode
			if (typeof component === "string") {
				var name = component;
				var factory = this._getComponentFactory(name);
				return this._addComponent(factory, name);
			}

			component = this._getFactoryResult(component);
			if (!this._isComponentSupported(component)) {
				console.warn("The component", component, "is not supported by", this);
			}

			this._registerComponent(component, id, options);

			// declarative mode
			// if a binding has been declared for this component, and all others components are active, enable it
			// we need to parse the whole _bindingFactories array each time
			if (id){
				var factories = this._bindingFactories;
				// if one of cmps is the component we are concerned about return true
				var someCb = function(cmpId){
					return cmpId === id;
				}.bind(this);
				// if one of cmps is not registered return false
				var everyCb = function(cmpId){
					return this._getComponent(cmpId) ? true : false;
				}.bind(this);

				for (var i=0; i<factories.length; i++){
					var cmps = factories[i][0];
					if (!Array.isArray(cmps)){ cmps = [cmps];}
					if (cmps.some(someCb) && cmps.every(everyCb)) {
						var bindings = this._getFactoryResult(factories[i][1]);
						this._registerBindings(cmps, bindings);
					}
				}
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
		 * Register binding cancelers for many components that will be canceled when deleting one of these component
		 *
		 * @param {Array|Object|Function}	components	list of components concerned by the bindings
		 * @param {binding|Array}	cancelers	List of binding cancelers
		 * @param {Object} Name Name used to retrive bindings by name
		 */
		_registerBindings: function(components, cancelers, name) {
			name = (name === undefined ? "default" : name); // prevent unpredictable behavior
			if (Array.isArray(components)){
				components.forEach(function(cmp, key){
					components[key] = this._getComponent(cmp);
				}.bind(this));
			} else {
				components = [this._getComponent(components)];
			}
			this._bindingsRegistry.push([components, cancelers, name]);
		},

		/*
		 * Cancel bindings registered for a component
		 *
		 * @param {Component|String}	component	Component or id
		 * @param {String}				[name]		Name of binding sets to remove. If none is provided, all bindings will be canceled
		 */
		_unbindComponent: function(component, name) {
			var reg = this._bindingsRegistry;
			var bindings = [];
			var i;
			var someCb = function(cmp){
				if (cmp === component){
					bindings = bindings.concat(reg[i][1]);
					reg.splice(i, 1);
					i--;
					return true; // exit early the "some" loop
				}
			};
			for (i = 0; i<reg.length; i++){
				if (name === undefined || name === reg[i][2]){
					reg[i][0].some(someCb);
				}
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
