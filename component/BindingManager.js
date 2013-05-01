define([
], function(
) {

	function BindingsManager(args) {
		// observable registry of components
		this._components = args.components;
		// registry of bindings linked to many components
		this._bindings = [];
		// auto unbind component when it is removed from components registry
		this._listener = this._components.on("removed", function(ev){
			this.unbind(ev.value);
		}.bind(this));
	}

	var proto = BindingsManager.prototype;

	/*
	 * Register binding cancelers for many components that will be canceled when deleting one of these component
	 *
	 * @param {Array|Object|Function}	components	list of components concerned by the bindings
	 * @param {binding|Array}	cancelers	List of binding cancelers
	 * @param {Object} Name Name used to retrive bindings by name
	 */
	proto.add = function(components, bindings, name) {
		name = (name === undefined ? "default" : name); // prevent unpredictable behavior
		if (!Array.isArray(components)){
			components = [components];
		}
		this._bindings.push([components, bindings, name]);
	};

	/*
	 * Call bindings cancelers registered for a component then remove them
	 *
	 * @param {Component|String}	component	Component or id
	 * @param {String}				[name]		Name of binding sets to remove. If none is provided, all bindings will be canceled
	 */
	proto.unbind = function(component, name) {
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

	proto.destroy = function(){
		this._listener.remove();
	};

	return BindingsManager;
});
