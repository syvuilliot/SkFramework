define([
	'ksf/utils/constructor',
	'ksf/utils/ManyMap',
	'collections/set',	'collections/map'
], function(
	ctr,
	ManyMap,
	Set,				Map
) {
	return ctr(function(args) {
		this.components = args.components;
		
		this._onHandlers = [
			this.components.on('added', function(cmp) {
				this.bind(cmp.key);
			}.bind(this)),
			this.components.on('removed', function(cmp) {
				this.unbind(cmp.key);
			}.bind(this))
		];

		this.binder = args.binder;

		this._activeDeps = new Set();
		this._activeBindings = new Map();
		this._factories = new ManyMap();
	}, {
		add: function(factory, deps) {
			if (!(deps.forEach)) {
				deps = [deps];
			}
			this._factories.add([factory], deps);
			deps.forEach(function(dep) {
				if (this._activeDeps.has(dep)) {
					this.bind(dep);
				}
			}.bind(this));
		},

		addEach: function(depsFactories) {
			depsFactories.forEach(function(depsFactory) {
				this.add(depsFactory[1], depsFactory[0]);
			}.bind(this));
		},

		bind: function(id) {
			this._activeDeps.add(id);

			var factories = this._factories.getValues(id);
			factories && factories.forEach(function(factory) {
				if (!this._activeBindings.has(factory)) {
					var deps = this._factories.getKeys(factory);
					// if every dependencies are active
					if (deps.every(function(id) { return this._activeDeps.has(id); }.bind(this))) {
						// activate binding and save result
						var cmps = deps.map(function(id) {
							return this.components.get(id);
						}.bind(this));
						this._activeBindings.add(this.binder.bind(factory, cmps), factory);
					}
				}
			}.bind(this));
		},

		unbind: function(id) {
			if (!this._activeDeps.has(id)) { return; }
			this._activeDeps.remove(id);

			var factories = this._factories.getValues(id);
			factories && factories.forEach(function(factory) {
				if (!this._activeBindings.has(factory)) { return; }

				this.binder.unbind.call(this.binder, this._activeBindings.get(factory));
				this._activeBindings.delete(factory);
			}.bind(this));
		},

		destroy: function() {
			this._onHandlers.forEach(function(handler) {
				handler.remove();
			});
		}
	});
});