define([
	'./constructor',
	'collections/map',
	'./Registry'
], function(
	constructor,
	Map,
	Registry
) {
	function isLiteralTree(item) {
		return Array.isArray(item) && item.length === 2 && Array.isArray(item[1]);
	}

	function isAttributedNode(item) {
		return Array.isArray(item) && item.length === 2 && !Array.isArray(item[1]);
	}

	var parseLiteralTree = function(tree, callback, root) {
		var node, options;
		if (isLiteralTree(tree)) {
			node = tree[0];
			if (isAttributedNode(node)) {
				options = node[1];
				node = node[0];
			}
			callback(node, root, options);

			tree[1].forEach(function(child){
				parseLiteralTree(child, callback, node);
			});
		} else if (tree instanceof Tree) {
			tree.forEach(function(node, parent, options) {
				callback(node, parent || root, options);
			});
		} else {
			node = tree;
			if (isAttributedNode(node)) {
				options = node[1];
				node = node[0];
			}
			callback(node, root, options);
		}
	};

	/*
	 * Tree with attributed nodes
	 */
	var Tree = constructor(function Tree (tree) {
			// register child <-> parent relations
			this._tree = new Registry();
			// map attributes to nodes
			this._attributes = new Map();
			if (tree !== undefined){
				if (isLiteralTree(tree)){
					parseLiteralTree(tree, function(node, parent, attr){
						this.set(node, parent, attr);
					}.bind(this));
				} else if (tree instanceof Tree){
					this.addTree(tree);
				} else {
					this.setRoot(tree);
				}
			}
		}, {

		/*
		 * Add node with attribute in tree as a child of parent
		 */
		set: function(node, parent, attr) {
			if (parent === undefined){
				this.setRoot(node, attr);
			} else {
				if (!this._tree.has(parent)) {
					this.setRoot(parent, attr);
				}
				if (!this._tree.has(node)) {
					this._tree.add(node, parent);
				}
				this._attributes.set(node, attr);
			}
		},

		setRoot: function(root, attr){
			if (! this.hasOwnProperty("_root")){
				this._root = root;
				this._tree.add(root);
				this._attributes.set(root, attr);
			} else {
				throw "The root node is already defined and cannot be changed";
			}
		},
		getRoot: function(){
			return this._root;
		},
		isLeaf: function(node) {
			return !this._tree.hasKey(node);
		},

		/*
		 * Remove node from tree
		 */
		remove: function(node) {
			this._tree.remove(node);
			this._attributes.delete(node);
		},

		getChildren: function(parent) {
			return this._tree.getValues(parent);
		},

		/*
		 * For each node of the tree call callback(node, parent, attr) following a top down order
		 */
		forEach: function(callback, scope) {
			var tree = this;
			function processNode(node, cb, parent){
				cb.call(scope, node, parent, tree.getAttribute(node));
				tree.getChildren(node).forEach(function(child){
					processNode(child, cb, node);
				});
			}
			if (this.hasOwnProperty("_root")){
				processNode(this.getRoot(), callback);
			}
		},

		getParent: function(child) {
			return this._tree.getKey(child);
		},

		getAttribute: function(node) {
			return this._attributes.get(node);
		},
		has: function(node){
			return this._tree.has(node);
		},
		addTree: function(tree, attachNode){
			tree.forEach(function(node, parent, attr){
				this.set(node, parent || attachNode, attr);
			}.bind(this));
		},
		get length(){
			return this._tree.length;
		},
		map: function(cb, scope){
			var clone = new Tree();
			var mapping = new Map();
			this.forEach(function(node, parent, attr){
				mapping.set(node, cb.call(scope, node));
				clone.set(mapping.get(node), mapping.get(parent), attr);
			});
			return clone;
		},

	});

	return Tree;
});
