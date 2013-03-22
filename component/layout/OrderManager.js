define([
	'dojo/_base/declare',	'dojo/_base/lang',
	'./PlacementManager',
	'../../utils/proxyFunctions'
], function(
	declare,				lang,
	PlacementManager,
	proxy
) {
	function isTree(item) {
		return lang.isArray(item) && item.length == 2 && lang.isArray(item[1]) && !isTree(item[1]);
	}
	
	/*
	 * Placement manager with ordered children
	 */
	var OrderManager = declare([], {
		/*
		 * @param {Object}	params		Constructor params:
		 *			{Array}	- placers	List of placers = placement implementation
		 */
		constructor: function(params) {
			this._placementMngr = new PlacementManager(params);
		},

		/*
		 * Place components in root
		 * 
		 * @param {Component|Array}		config		Component/Tree, or Array of Component/Tree
		 * @param {Component}			parent		Component
		 * @param {Integer}				[options]	Position of node, default to last position
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
			this._placementMngr.place(node, parent, options);
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
			this._placementMngr.unplace(node);
		}
	});

	proxy.props(OrderManager.prototype, '_placementMngr', ['_placers']);

	// Proxy some methods of underlying placement manager
	proxy.methods(OrderManager.prototype, '_placementMngr', {
		getChildren: 'getChildren',
		getParent: 'getParent',
		getOptions: 'getOptions'
	});

	return OrderManager;
});
