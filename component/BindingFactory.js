define([
	'ksf/utils/constructor',
	'dojo/aspect'
], function(
	ctr,
	aspect
) {
	return ctr(function Factory(args) {
		this._componentsRegistry = args.registry;
		this._componentsFactory = args.componentsFactory;
		this._bindingsFactories = [];

		// hook components factory's 'create' method for auto-binding feature on creation:
		this._cancelFactoryHook = aspect.after(this._componentsFactory, 'create', function(id) {
			this.bind(id);
		}.bind(this), true);
	}, {

		// a bindingsFactory is: function(cmp1, ...){doBinding(); return canceler;}
		add: function(cmps, factory) {
			if (!Array.isArray(cmps)){
				cmps = [cmps];
			}
			this._bindingsFactories.push([cmps, factory]);
		},
		addEach: function(factoriesList) {
			factoriesList.forEach(function (cmpsAndFactory) {
				this.add(cmpsAndFactory[0], cmpsAndFactory[1]);
			}, this);
		},

		// execute all bindings factories that reference this component and for which each dependant component is alive (registered in _componentsRegistry)
		// it is a private method since the user should not execute bindings factories out of the component creation process
		bind: function(id) {
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

			for (var i = 0; i < factories.length; i++){
				var cmpIds = factories[i][0];
				if (cmpIds.some(someCb) && cmpIds.every(everyCb)) {
					var factory = factories[i][1];
					var cmps = cmpIds.map(mapCb);
					var bindings = factory.apply(undefined, cmps);
					this._componentsRegistry.addBindings(cmps, bindings);
				}
			}
		},

		destroy: function() {
			this._cancelFactoryHook();
		}
	});
});
