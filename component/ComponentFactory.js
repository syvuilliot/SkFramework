define([
	'ksf/utils/constructor'
], function(
	ctr
) {
	return ctr(function Factory(args) {
		this._componentsRegistry = args.registry;
		this._componentFactories = {};
	}, {
		add: function(id, factory) {
			this._componentFactories[id] = factory;
		},
		addEach: function(factoriesMap) {
			for (var id in factoriesMap) {
				this.add(id, factoriesMap[id]);
			}
		},
		remove: function(id) {
			delete this._componentFactories[id];
		},

		get: function(id) {
			return this._componentFactories[id];
		},

		has: function(id) {
			return this.get(id) !== undefined;
		},

		create: function(id) {
			// Check in the registry whether it already exists
			if (this._componentsRegistry.has(id)) { throw "The component is already created"; }
			// Create the component
			var cmpFactory = this.get(id);
			var cmp = cmpFactory.call();
			this._componentsRegistry.add(cmp, id);
			return cmp;
		},

		createEach: function(ids) {
			if (typeof ids.forEach === "function") {
				ids.forEach(function(cmp) {
					this.create(cmp);
				}, this);
			}
		}
	});
});
