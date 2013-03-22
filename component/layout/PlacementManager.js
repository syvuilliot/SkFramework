define([
	'dojo/_base/declare',	'dojo/_base/array',
	'collections/map',	'../../utils/Registry'
], function(
	declare,				array,
	Map,				Registry
) {
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

			// register child <-> parent links
			this._placementTree = new Registry();
			// map placement options to placed nodes
			this._placementOptions = new Map();
		},
		
		/*
		 * Place a single node in a parent
		 * 
		 * @param {Component}	node		Component
		 * @param {Component}	parent		Component
		 * @param {Object}		[options]	Placement options
		 */
		place: function(node, parent, options) {
			if (array.some(this._placers, function(placer) {
				return placer.place(node, parent, options);
			})) {
				// register placement
				this._placementTree.add(node, parent);
				this._placementOptions.add(options, node);
				return true;
			} else {
				console.warn("Unable to place", node, "in", parent);
				return false;
			}
		},
		
		/*
		 * Unplace a node from the global tree
		 *
		 * @param {Component}	node		Component
		 */
		unplace: function(node) {
			var parent = this.getParent(node);
			if (parent) {
				if (array.some(this._placers, function(placer) {
					return placer.unplace(node, parent);
				})) {
					// remove placement from register
					this._placementTree.remove(node);
					this._placementOptions.delete(node);
					return true;
				} else {
					console.warn("Unable to unplace node", node, "from", parent);
					return false;
				}
			} else {
				console.warn("Node not placed:", node);
				return false;
			}
		},

		getChildren: function(parent) {
			return this._placementTree.getValues(parent);
		},

		getParent: function(child) {
			return this._placementTree.getKey(child);
		},

		getOptions: function(node) {
			return this._placementOptions.get(node);
		}
	});
});
