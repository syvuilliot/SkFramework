define([
	"./ComponentsRegistry",
	"../utils/proxyFunctions",
], function(
	ComponentsRegistry,
	proxy
) {


	// a component manager is designed to register component factories and bindings factories, in order to be abale to create and delete components many times
	function ComponentsManager(params) {
		this._componentsRegistry = new ComponentsRegistry();
		this._componentFactories = {};
		this._bindingsFactories = [];
	}

	var proto = ComponentsManager.prototype;

	proto.addComponentFactory = function(id, factory){
		this._componentFactories[id] = factory;
	};
	proto.removeComponentFactory = function(id){
		delete this._componentFactories[id];
	};
	// private method to abstract _componentFactories implementation
	proto._getComponentFactory = function(id){
		return this._componentFactories[id];
	},

	// a bindingsFactory is [[cmp1, ...], function(cmp1, ...){doBinding(); return [canceler1, ...];}]
	proto.addBindingsFactory = function(cmps, factory){
		if (!Array.isArray(cmps)){
			cmps = [cmps];
		}
		this._bindingsFactories.push([cmps, factory]);
	};
	// TODO ?
/*	proto.removeBindingsFactory = function(cmp){

	};
*/

	proto.create = function(id){
		var cmpFactory = this._getComponentFactory(id);
		var cmp = cmpFactory.call(this);
		this._componentsRegistry.add(cmp, id);
		this._bind(id);
		return cmp;
	};

	proto.createEach = function(ids){
		if (typeof ids.forEach === "function") {
			ids.forEach(function (cmp) {
				this.create(cmp);
			}, this);
		}

	};

	proto.delete = function(id){
		this._componentsRegistry.remove(id);
	};

	// execute all bindings factories that reference this component and for which each dependant component is alive (registered in _componentsRegistry)
	// it is a private method since the user should not execute bindings factories out of the component creation process
	proto._bind = function(id){
		var factories = this._bindingsFactories;
		// if one of cmps is the component we are concerned about return true
		var someCb = function(cmpId){
			return cmpId === id;
		}.bind(this);
		// if one of cmps is not registered return false
		var everyCb = function(cmpId){
			return this._componentsRegistry.has(cmpId) ? true : false;
		}.bind(this);
		// convert cmpIds to cmps
		var mapCb = function(cmpId){
			return this._componentsRegistry.get(cmpId);
		}.bind(this);

		for (var i=0; i<factories.length; i++){
			var cmpIds = factories[i][0];
			if (cmpIds.some(someCb) && cmpIds.every(everyCb)) {
				var factory = factories[i][1];
				var cmps = cmpIds.map(mapCb);
				var bindings = factory.apply(this, cmps);
				this._componentsRegistry.addBindings(cmps, bindings);
			}
		}
	};

	proxy.methods(proto, "_componentsRegistry", [
		"get",
	]);



	return ComponentsManager;
});
