define([
	"./ComponentsRegistry",
	"../utils/proxyFunctions",
], function(
	ComponentsRegistry,
	proxy
) {

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
		this._bindingsFactories.push([cmps, factory]);
	};
	// TODO ?
/*	proto.removeBindingsFactory = function(cmp){

	};
*/

	proto.createComponent = function(id){
		var cmpFactory = this._getComponentFactory(id);
		var cmp = cmpFactory.call(this);
		this._componentsRegistry.addComponent(cmp);
		this._bindComponent(id);
		return cmp;
	};

	// execute all bindings factories that reference this component and for which each dependant component is alive (registered in _componentsRegistry)
	// it is a private method since the user should not execute bindings factories out of the component creation process
	proto._bindComponent = function(id){
		var factories = this._bindingsFactories;
		// if one of cmps is the component we are concerned about return true
		var someCb = function(cmpId){
			return cmpId === id;
		}.bind(this);
		// if one of cmps is not registered return false
		var everyCb = function(cmpId){
			return this._componentsRegistry.hasComponent(cmpId) ? true : false;
		}.bind(this);
		// convert cmpIds to cmps
		var mapCb = function(cmpId){
			return this._componentsRegistry.getComponent(cmpId);
		}.bind(this);

		for (var i=0; i<factories.length; i++){
			var cmpIds = factories[i][0];
			if (cmpIds.some(someCb) && cmpIds.every(everyCb)) {
				var factory = factories[i][1];
				var cmps = cmpIds.map(mapCb);
				var bindings = factory.apply(this, cmps);
				this.addBindings(cmps, bindings);
			}
		}
	};

	proxy.methods(proto, "_componentsRegistry", [
		"addComponent",
		"removeComponent",
		"addBindings",
		"unbindComponent", // for those that would like to unbind a component without removing it (especially when there are named bindings)
	]);

	return ComponentsManager;
});
