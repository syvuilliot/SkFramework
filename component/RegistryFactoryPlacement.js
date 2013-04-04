define([
	'ksf/utils/constructor',
	'ksf/utils/AttributeTree',
], function(
	ctr,
	Tree
){
	return ctr(function(args){
		this._components = args.components;
		this._placementManager = args.placement;
	}, {
		place: function  (config) {
			// convert literal placementTree to a tree
			var idTree = new Tree(config);
			// map tree of id to tree of components
			// be sure that all components to be placed are created or create them
			var cmpTree = idTree.map(function(id){
				return this._components.get(id) || this._components.create(id);
			}, this);

			// var unplaced = this._placement.delta(cmpTree)[0];
			// do the placement
			this._placementManager.set(cmpTree);
			// delete all unplaced components
			// unplaced.forEach(this._components._delete, this);
		},
		delete: function(cmpId){
			var cmp = this._components.get(cmpId);
			this._placementManager.remove(cmp);
			this._components.delete(cmp);
		},
	});
});