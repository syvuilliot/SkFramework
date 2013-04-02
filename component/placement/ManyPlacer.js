define([
	'ksf/utils/constructor',	'dojo/_base/lang'
], function(
	ctr,				lang,
	AttributeTree
) {
	function isAttributedNode(item) {
		return lang.isArray(item) && item.length == 2 && !lang.isArray(item[1]);
	}

	function isTree(item) {
		return lang.isArray(item) && item.length == 2 && lang.isArray(item[1]);
	}

	/*
	 * Placement manager with ordered children
	 */
	return ctr(
		/*
		 * @param {Object}	placer		Placer = placement implementation
		 */
		function(placer) {
			this._placer = placer;
		}, {

		/*
		 * Place a node or tree in parent
		 *
		 * @param {Object|Array}	node		Node or Tree
		 * @param {Object}			parent		Node
		 * @param {Object}			[options]	Placement options
		 */
		put: function(node, parent, options) {
			if (isTree(node)) {
				// tree
				this._putTree(node, parent);
			} else {
				// single node
				this._putNode(node, parent, options);
			}
		},

		/*
		 * Place many nodes in parent
		 *
		 * @param {Array}	nodes		Array of nodes
		 * @param {Object}	parent		Node
		 */
		putEach: function(nodes, parent) {
			nodes.forEach(function(node) {
				this.put(node, parent);
			}.bind(this));
		},

		/*
		 * Place a single node in parent
		 *
		 * @param {Object}	node		Node
		 * @param {Object}	parent		Node
		 * @param {Object}	[options]	Placement options
		 */
		_putNode: function(node, parent, options) {
			if (isAttributedNode(node)) {
				options = node[1];
				node = node[0];
			}
			this._placer.put(node, parent, options);
			return node;
		},

		/*
		 * Place a subtree in a parent
		 *
		 * @param {Array}	tree		Tree
		 * @param {Object}	parent		Object
		 */
		_putTree: function(tree, parent) {
			var root = this._putNode(tree[0], parent);
			this.putEach(tree[1], root);
		},

		/*
		 * Unplace a node or tree from parent
		 *
		 * @param {Object|Array}	node		Node or Tree
		 * @param {Object}			parent		Node
		 */
		remove: function(node, parent) {
			if (isTree(node)) {
				// tree
				this._removeTree(node, parent);
			} else {
				// leaf
				this._removeNode(node, parent);
			}
		},

		/*
		 * Unplace nodes from root
		 *
		 * @param {Array}	nodes	Array of nodes
		 */
		removeEach: function(nodes, parent) {
			nodes.forEach(function(node) {
				this.remove(node, parent);
			}.bind(this));
		},

		/*
		 * Unplace a node from the global tree
		 *
		 * @param {Object}	node	Node
		 */
		_removeNode: function(node, parent) {
			this._placer.remove(node, parent);
		},

		/*
		 * Unplace a subtree from the global tree
		 *
		 * @param {Array}	tree	Tree
		 */
		_removeTree: function(tree, parent) {
			// unplace children of root first
			this.removeEach(tree[1], tree[0]);
			// then unplace root
			this._removeNode(tree[0], parent);
		}
	});
});
