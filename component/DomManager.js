define([
	'compose',	'ksf/utils/createConstructor',	'dojo/_base/lang',
	'./Manager',	'./_LazyFactory',
	'./placement/MultiPlacers',	'./placement/ManyPlacer',	'./placement/Manager',
	'./placement/samples/KsDomInDom',	'./placement/samples/DomInKsDom',	'./placement/samples/DomInDom',
	'ksf/utils/string'
], function(
	compose,	ctr,							lang,
	Manager,		_LazyFactory,
	MultiPlacers,				ManyPlacer,					PlacementManager,
	KsDomInDom,							DomInKsDom,							DomInDom,
	str
) {
	var DomManagerPlacer = ctr(function(placer, registry) {
		this._placer = placer;
		this._registry = registry;
	}, {
		put: function(component, parent, options) {
			if (!this._registry.has(component)) {
				throw "Cannot place unknown component";
			}

			var id = this._registry.getId(component);
			if (id) {
				options = lang.mixin({
					// add DOM className from the hyphenated component's id
					className: str.hyphenate(id)
				}, options)
			}

			this._placer.put(this._registry.get(component), this._registry.get(parent), options);
		},
		set: function(component, parent, options) {
			if (!this._registry.has(component)) {
				throw "Cannot configure unknown component";
			}
			this._placer.set(this._registry.get(component), this._registry.get(parent), options);
		},
		remove: function(component, parent, options) {
			if (!this._registry.has(component)) {
				throw "Cannot unplace unknown component";
			}
			this._placer.remove(this._registry.get(component));
		}
	});

	return compose(Manager, _LazyFactory,
		function DomManager(params) {
			this._placer = (params && params.placer) || new ManyPlacer(new DomManagerPlacer(new PlacementManager(new MultiPlacers([new DomInDom(), new KsDomInDom(), new DomInKsDom()])),
				this._componentsRegistry));
		}, {
			place: function(arg, container, options) {
				this._placer.put(arg, container, options);
			},
			placeEach: function(arg, container, options) {
				this._placer.putEach(arg, container, options);
			},
			unplace: function(arg) {
				this._placer.remove(arg);
			},
			unplaceEach: function(arg) {
				this._placer.removeEach(arg);
			},

			delete: function(id) {
				this.unplace(this._componentsRegistry.get(id));
				this._componentsRegistry.remove(id);
			}
		}
	);
});
