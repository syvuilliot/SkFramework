define([
	'dojo/_base/declare',
	'collections/map',	'./Registry'
], function(
	declare,
	Map,				Registry
) {
	/*
	 * Tree with attributed nodes
	 */
	return declare([], {
		constructor: function(params) {
			// register child <-> parent relations
			this._tree = new Registry();
			// map attributes to nodes
			this._attributes = new Map();
		},

		/*
		 * Add node with attribute in tree as a child of parent
		 */
		set: function(node, parent, attr) {
			if (!this._tree.has(node)) {
				this._tree.add(node, parent);
			}
			this._attributes.set(node, attr);
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
		 * Loop over pairs of [child, parent(, options)]
		 */
		forEachPair: function(callback) {
			return this._tree.items().forEach(function(item) {
				callback(item[0], item[1], this.getAttribute(item[0]));
			}.bind(this));
		},

		getParent: function(child) {
			return this._tree.getKey(child);
		},

		getAttribute: function(node) {
			return this._attributes.get(node);
		},
		has: function(node){
			return this._tree.has(node);
		}
	});
});
