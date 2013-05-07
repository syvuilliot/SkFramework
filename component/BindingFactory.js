define([
	'ksf/utils/constructor',
	'ksf/utils/ManyMap',
	'collections/set'
], function(
	ctr,
	ManyMap,
	Set
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
		this._activeBindings = new ManyMap();
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
				if (!this._activeBindings.hasValue(factory)) {
					var deps = this._factories.getKeys(factory);
					// if every dependencies are active
					if (deps.every(function(id) { return this._activeDeps.has(id); }.bind(this))) {
						// activate binding and save result
						var cmps = deps.map(function(id) {
							return this.components.get(id);
						}.bind(this));
						this._activeBindings.add([factory, cmps, this.binder.bind(factory, cmps)], deps);
					}
				}
			}.bind(this));
		},

		unbind: function(id) {
			this._activeDeps.remove(id);
			this._activeBindings.getValues(id).forEach(function(args) {
				this.binder.unbind.apply(this.binder, args);
			}.bind(this));
		},

		destroy: function() {
			this._onHandlers.forEach(function(handler) {
				handler.remove();
			});
		}
	});
});