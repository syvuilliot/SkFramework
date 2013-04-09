define([
	'ksf/utils/constructor',
	'ksf/utils/AttributeTree',
	'dojo/aspect'
], function(
	ctr,
	Tree,
	aspect
) {
	return ctr(function(args){
		this._registry = args.registry;
		this._factory = args.factory;
		this._placementManager = args.placementManager;
		this._root = args.root;

		// hook components registry's 'delete' method:
		this._cancelDeleteHook = aspect.before(this._registry, 'delete', function(arg) {
			this.remove(arg);
		}.bind(this), true);
	}, {
		_getOrCreate: function(id) {
			return this._registry.get(id) || this._factory.create(id);
		},
		set: function(config) {
			var idTree = new Tree([this._root, config]);
			
			// map tree of id to tree of components
			// be sure that all components to be placed are created or create them
			var cmpTree = idTree.map(function(id){
				return this._getOrCreate(id);
			}, this);

			this._placementManager.set(cmpTree);
		},
		remove: function(cmpId) {
			var cmp = this._registry.get(cmpId);
			if (cmp) {
				this._placementManager.remove(cmp);
			}
		},
		add: function(child, parent, options) {
			parent = parent || this._root;
			return this._placementManager.add(
				this._getOrCreate(child),
				this._getOrCreate(parent),
				options
			);
		}
	});
});