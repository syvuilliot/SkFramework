define([
	"ksf/utils/constructor",
], function(
	ctr
){
	/**
	Register functions to be executed when dependant components are available
	The dependancies are exprimed by componentId
	Observe a components registry to execute those functions
	*/
	return ctr(function(args){
		this._components = args.components;
		this._bindings = args.bindings;
		this._factories = [];
		this._componentsObserver = this._components.on("added", function(ev){
			this.bindComponent(ev.key);
		}.bind(this));
	}, {
		add: function(cmps, factory) {
			if (!Array.isArray(cmps)){
				cmps = [cmps];
			}
			this._factories.push([cmps, factory]);
		},
		addEach: function(cmpsAndFactory) {
			this._factories.addEach(cmpsAndFactory);
		},
		// execute all bindings factories that reference this component and for which each dependant component is alive (registered in _componentsRegistry)
		// it is a private method since the user should not execute bindings factories out of the component creation process
		bindComponent: function(id) {
			var factories = this._factories;
			// if one of cmps is the component we are concerned about return true
			var someCb = function(cmpId){
				return cmpId === id;
			}.bind(this);
			// if one of cmps is not registered return false
			var everyCb = function(cmpId){
				return this._components.hasKey(cmpId);
			}.bind(this);
			// get cmp from id
			var mapCb = function(cmpId){
				return this._components.get(cmpId);
			}.bind(this);

			for (var i = 0; i < factories.length; i++){
				var cmpIds = factories[i][0];
				// if factory is dependant from this component and all other components are available
				if (cmpIds.some(someCb) && cmpIds.every(everyCb)) {
					var factory = factories[i][1];
					// get components
					var cmps = cmpIds.map(mapCb);
					// execute factory
					var bindings = factory.apply(null, cmps);
					// register bindings
					this._bindings.add(cmps, bindings);
				}
			}
		},

		destroy: function() {
			this._componentsObserver();
		}
	});


});