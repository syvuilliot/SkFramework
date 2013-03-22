define([
	'dojo/_base/declare',	'dojo/_base/lang',
	'collections/map'
], function(
	declare,				lang,
	Map
) {
	function isTree(item) {
		return lang.isArray(item) && item.length == 2 && lang.isArray(item[1]) && !isTree(item[1]);
	}
	
	/*
	 * Mixin adding placement API for Component
	 */
	return declare([], {
		constructor: function() {
			// map children to containers
			this._placedComponents = new Map();
		},
		/*
		 * Place own children in own container
		 * 
		 * @param {Component|String|Array}	arg			Component/id/tree, or array of component/id/tree
		 * @param {Component|String}		container	Component or id
		 * @param {String|Object}			[options]	Placement options
		 */
		_place: function(arg, container, options) {
			container = this._getComponent(container);
			if (!container) {
				throw "Unknown component";
			}
			if (!lang.isArray(arg) || isTree(arg)) {
				arg = [arg];
			}
			
			arg.forEach(function(item) {
				if (isTree(item)) {
					// tree
					this._placeTree(item, container, options);
				} else {
					// leaf
					this._placeLeaf(item, container, options);
				}
			}.bind(this));
		},
		
		/*
		 * Place a subtree in a container
		 * 
		 * @param {Object}			tree		Tree
		 * @param {Component}		container	Component
		 * @param {String|Object}	[options]	Placement options
		 */
		_placeTree: function(tree, container, options) {
			var leaf, root;
			root = this._placeLeaf(tree[0], container);
			this._place(tree[1], root);
		},
		
		/*
		 * Place a flat, single item
		 * 
		 * @param {Component|String}	leaf		Component or id
		 * @param {Component}			container	Component
		 * @param {String|Object}		[options]	Placement options
		 */
		_placeLeaf: function(leaf, container, options) {
			leaf = this._getComponent(leaf);
			if (leaf) {
				if (this._doPlaceComponent(leaf, container, options)) {
					this._placedComponents.set(leaf, container);
				}
			}
			return leaf;
		},
		
		/*
		 * Placing implementation
		 * 
		 * @param {Component}	component	Component
		 * @param {Component}	container	Component
		 * @param {Object}		options		Placement options
		 */
		_doPlaceComponent: function(component, container, options) {
			// To be overridden
			console.warn("Component could not be placed:", component, "in", container);
			return false;
		},
		
		/*
		 * Unplace own component from own container
		 * 
		 * @param {Component|String|Object|Array}	children	Component/id/tree, or array of component/id/tree
		 */
		_unplace: function(children) {
			if (!lang.isArray(children)) {
				children = [children];
			}
			
			children.forEach(function(item) {
				if (isTree(item)) {
					// tree
					this._unplaceTree(item);
				} else {
					// leaf
					this._unplaceLeaf(item);
				}
			}.bind(this));
		},
		
		/*
		 * Unplace several subcomponents
		 * 
		 * @param {Array}	components	List of Component objects and/or ids
		 */
		_unplaceTree: function(tree) {
			// unplace children of root first
			this._unplace(tree[1]);
			// then unplace root
			this._unplaceLeaf(tree[0]);
		},
		
		_unplaceLeaf: function(leaf) {
			var container;
			leaf = this._getComponent(leaf);
			
			if (leaf && this._placedComponents.has(leaf)) {
				// remove leaf from the container where it had been placed
				if (this._doUnplaceComponent(leaf, this._placedComponents.get(leaf))) {
					// remove from _placedComponents
					this._placedComponents.delete(leaf);
				}
			}
			return leaf;
		},

		/*
		 * Unplacing implementation
		 * 
		 * @param {Component}	container	Component
		 * @param {Component}	component	Component
		 */
		_doUnplaceComponent: function(component, container) {
			// To be overridden
			console.warn("Component could not be unplaced:", component, "from", container);
			return false;
		},
		
		_deleteComponent: function(component) {
			this._unplace(component);
			this.inherited(arguments);
		}
	});
});
