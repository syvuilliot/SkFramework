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
		this.registry = args.registry;
		this.factory = args.factory;
		this.placementManager = args.placementManager;
		this.root = args.root;

		// hook components registry's 'delete' method:
		this._cancelDeleteHook = aspect.before(this.registry, 'delete', function(arg) {
			this.remove(arg);
		}.bind(this), true);
	}, {
		_getOrCreate: function(id) {
			return this.registry.get(id) || this.factory.create(id);
		},
		set: function(config) {
			var idTree = new Tree([this.root, config]);
			
			// map tree of id to tree of components
			// be sure that all components to be placed are created or create them
			var cmpTree = idTree.map(function(id){
				return this._getOrCreate(id);
			}, this);

			this.placementManager.set(cmpTree);
		},
		remove: function(cmpId) {
			var cmp = this.registry.get(cmpId);
			if (cmp) {
				this.placementManager.remove(cmp);
			}
		},
		add: function(child, parent, options) {
			parent = parent || this.root;
			return this.placementManager.add(
				this._getOrCreate(child),
				this._getOrCreate(parent),
				options
			);
		}
	});
});