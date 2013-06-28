define([
	'ksf/utils/constructor',
	'ksf/utils/AttributeTree',
], function(
	ctr,
	Tree,
	aspect
) {
	return ctr(function(args){
		this._registry = args.registry;
		this._placementManager = args.placementManager;
		this._placement = null;
	}, {
		set: function(layoutTree) {
			var oldTree = this._placement;
			var idTree = this._placement = new Tree(layoutTree);

			// map tree of ids to tree of components
			var cmpTree = idTree.map(function(id){
				return this._registry.get(id);
			}, this);

			// Place new configuration
			this._placementManager.set(cmpTree);

			// release components that are no more placed
			if (oldTree && this._registry.release) {
				oldTree.forEach(function(id){
					if (!idTree.has(id)){
						this._registry.release(id);
					}
				}.bind(this));
			}
		}
	});
});