define([
	'ksf/utils/constructor',
	'frb/bindings',
	'frb/observe',
	'./CollectionRenderer',
	"collections/map",
], function(
	ctr,
	bindings,
	observe,
	CollectionRenderer,
	Map
){
	var ConfigRenderer = ctr(function ConfigRenderer(args){
		this.item = args.item;
		// store the config lines itself instead of using the same object as ObjectRenderer because we need to access configLine.renderer.unplace when it is no more available
		this._config = [];
	}, {
		create: function(configLine, index){
			this._config.splice(index, 0, configLine);
			var cmp = configLine.renderer.create();
			return bindings.defineBinding(cmp, configLine.renderer.property, {
				"<->": "item."+configLine.property,
				source: this,
				// prevent observation of
				// twoWay: (cmp instanceof HTMLElement && !cmp.makePropertyObservable) ? false : true,
				// trace: true,
			});
		},
		destroy: function(cmp, index){
			var renderer = this._config[index].renderer;
			bindings.cancelBinding(cmp, renderer.property);
			renderer.destroy(cmp, index);
			this._config.splice(index, 1);
		},
		place: function(cmp, container, index){
			this._config[index].renderer.place(cmp, container, index);
		},
		unplace: function(cmp, container, index){
			this._config[index].renderer.unplace(cmp, container, index);
		},
	});

	return ctr(function ObjectRenderer(args){
		this._configRenderer = new ConfigRenderer({
			item: args.item,
		});
		this._renderer = new CollectionRenderer({
			container: args.container,
			renderer: this._configRenderer,
			collection: args.config,
		});
	}, {
		config: {
			get: function(){
				return this._renderer.collection;
			},
			set: function(config){
				this._renderer.collection = config;
			},
		},
		item: {
			set: function(item){
				this._configRenderer.item = item;
			},
			get: function () {
				return this._configRenderer.item;
			},
		},
		// container cannot be changed after creation
		get container(){
			return this._renderer.container;
		},
		destroy: function(){
			// how to disting between the "destroy component" method and the destroy itself method ?
			// this._configRenderer.destroySelf();
			this._renderer.destroy();
		}
	});
});