define([
	'compose',
	'collections/dict',
	'ksf/collections/AttributeTree',
	'ksf/collections/ObservableObject'
], function(
	compose,
	Dict,
	Tree,
	ObservableObject
){
	return compose(ObservableObject,
		function(args) {
			this._registry = args.registry;
			this.configs = new Dict();
		},
		{
			apply: function(configId) {
				var config = this.configs.get(configId);

				var tree = new Tree(config);

				// map tree of ids to tree of components
				var cmpTree = tree.map(function(node) {
					return this._resolveNode(node);
				}, this);

				this._applyTree(cmpTree);
			},

			_rootGetter: function() {
				return this._currentTree.root;
			},

			_applyTree: function(tree) {
				// empty all containers no more present in new config
				this._currentTree && this._currentTree.forEachParent(function(parent, children) {
					if (!tree.has(parent)) {
						parent.remove('content');
					}
				}.bind(this));

				tree.forEachParent(function(parent, children) {
					parent.set('content', children.map(function(child) {
						var options = tree.getAttribute(child, parent);
						return options ? [child, options] : child;
					}));
				});

				this._currentTree = tree;
			},

			_resolveNode: function(node) {
				if (this._registry.has(node)) {
					return this._registry.get(node);
				} else {
					return node;
				}
			},

			_treeGetter: function() {
				return this._currentTree;
			}
		}
	);
});