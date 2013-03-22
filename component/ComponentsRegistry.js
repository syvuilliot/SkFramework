define([
	"../utils/Registry",
	"../utils/proxyFunctions",
], function(
	Registry,
	proxy
) {

	function ComponentsRegistry(params){
		// registry of components
		this._components = new Registry();
		// registry of bindings linked to many components
		this._bindings = [];
	}

	var proto = ComponentsRegistry.prototype;

	/*
	 * Add sub-components
	 *
	 * @param {Component} component	Component instance to be added.
	 * @param {String}		[id]		Id of component
	 */
	proto.add = function (components) {
		for (var id in components) {
			var cmp = components[id];
			if (components instanceof Array) {
				this._components.add(cmp);
			} else {
				this._components.add(cmp, id);
			}
		}
	}

	/*
	 * Delete a subcomponent
	 *
	 * @param {Component|String}	component	Component or id
	 */
	proto.removeComponent = function (cmp) {
		cmp = this.getComponent(cmp);
		if (!cmp) {return;}
		this.unbindComponent(cmp);
		this._components.remove(cmp);
	};

	/*
	 * Get a subcomponent by id or return the provided component if it is registered (undefined otherwise)
	 * Can be used by other methods to "normalize" the component argument :
	 * if the argument is a registered component it is returned
	 *
	 * @param {String|Component}	component	Component or id
	 * @return {Component|undefined} Subcomponent
	 */
	proto.getComponent = function(arg) {
		if (typeof arg === "string") {
			return this._components.getValues(arg)[0];
		} else {
			return this._components.has(arg) ? arg : undefined;
		}
	};

	proto.hasComponent = function(arg){
		if (typeof arg === "string") {
			return this._components.hasKey(arg);
		} else {
			return this._components.has(arg);
		}
	};

	/*
	 * Register binding cancelers for many components that will be canceled when deleting one of these component
	 *
	 * @param {Array|Object|Function}	components	list of components concerned by the bindings
	 * @param {binding|Array}	cancelers	List of binding cancelers
	 * @param {Object} Name Name used to retrive bindings by name
	 */
	proto.addBindings = function(components, cancelers, name) {
		name = (name === undefined ? "default" : name); // prevent unpredictable behavior
		if (Array.isArray(components)){
			components.forEach(function(cmp, key){
				components[key] = this.getComponent(cmp);
			}.bind(this));
		} else {
			components = [this.getComponent(components)];
		}
		this._bindings.push([components, cancelers, name]);
	};

	/*
	 * Call bindings cancelers registered for a component then remove them
	 *
	 * @param {Component|String}	component	Component or id
	 * @param {String}				[name]		Name of binding sets to remove. If none is provided, all bindings will be canceled
	 */
	proto.unbindComponent = function(component, name) {
		var reg = this._bindings;
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
	};

	proxy.props(proto, "_components", ["length"]);


	return ComponentsRegistry;
});
