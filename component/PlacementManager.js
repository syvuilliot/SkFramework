define([
	'dojo/_base/declare',	'dojo/_base/lang',	'dojo/_base/array',
	'collections/map'
], function(
	declare,				lang,				array,
	Map
) {
	function isTree(item) {
		return lang.isArray(item) && item.length == 2 && lang.isArray(item[1]) && !isTree(item[1]);
	}
	
	/*
	 * Placement manager
	 */
	return declare([], {
		/*
		 * @param {Object}	params		Constructor params:
		 *			{Array}	- placers	List of placers = placement implementation
		 */
		constructor: function(params) {
			this._placers = params.placers;

			// map children to parents
			this._tree = new Map();
		},
		/*
		 * Place components in root
		 * 
		 * @param {Component|Array}		config		Component/Tree, or Array of Component/Tree
		 * @param {Component}			parent		Component
		 * @param {Object}				[options]	Placement options
		 */
		place: function(config, parent, options) {
			if (!lang.isArray(config) || isTree(config)) {
				config = [config];
			}
			
			config.forEach(function(item) {
				if (isTree(item)) {
					// tree
					this._placeTree(item, parent, options);
				} else {
					// leaf
					this._placeNode(item, parent, options);
				}
			}.bind(this));
		},
		
		/*
		 * Unplace components from root
		 * 
		 * @param {Component|Array}		config		Component/Tree, or Array of Component/Tree
		 */
		unplace: function(config) {
			if (!lang.isArray(config)) {
				config = [config];
			}
			
			config.forEach(function(item) {
				if (isTree(item)) {
					// tree
					this._unplaceTree(item);
				} else {
					// leaf
					this._unplaceNode(item);
				}
			}.bind(this));
		},
		
		/*
		 * Place a subtree in a parent
		 * 
		 * @param {Object}		tree		Tree
		 * @param {Component}	parent		Component
		 * @param {Object}		[options]	Placement options
		 */
		_placeTree: function(tree, parent, options) {
			this._placeNode(tree[0], parent);
			this.place(tree[1], tree[0], options);
		},
		
		/*
		 * Place a single node in a parent
		 * 
		 * @param {Component}	node		Component
		 * @param {Component}	parent		Component
		 * @param {Object}		[options]	Placement options
		 */
		_placeNode: function(node, parent, options) {
			if (this._doPlace(node, parent, options)) {
				this._tree.set(node, parent);
			}
		},
		
		/*
		 * Placing implementation
		 * 
		 * @param {Component}	child	Component
		 * @param {Component}	parent		Component
		 * @param {Object}		options		Placement options
		 */
		_doPlace: function(child, parent, options) {
			if (array.some(this._placers, function(placer) {
				return placer.place(child, parent, options);
			})) {
				return true;
			} else {
				console.warn("Component could not be placed:", child, "in", parent);
				return false;
			}
		},
		
		/*
		 * Unplace a subtree from the global tree
		 * 
		 * @param {Array}	tree	Tree
		 */
		_unplaceTree: function(tree) {
			// unplace children of root first
			this.unplace(tree[1]);
			// then unplace root
			this._unplaceNode(tree[0]);
		},
		
		/*
		 * Unplace a node from the global tree
		 *
		 * @param {Component}	node		Component
		 */
		_unplaceNode: function(node) {
			if (node && this._tree.has(node)) {
				// remove node from the parent where it had been placed
				if (this._doUnplace(node, this._tree.get(node))) {
					// remove from _tree
					this._tree.delete(node);
				}
			}
			return node;
		},

		/*
		 * Unplacing implementation
		 * 
		 * @param {Component}	parent	Component
		 * @param {Component}	child	Component
		 */
		_doUnplace: function(child, parent) {
			if (array.some(this._placers, function(placer) {
				return placer.unplace(child, parent);
			})) {
				return true;
			} else {
				console.warn("Component could not be unplaced:", child, "from", parent);
				return false;
			}
		}
	});
});
