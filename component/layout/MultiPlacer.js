define([
	'ksf/utils/constructor',
	'dojo/_base/array'
], function(
	ctr,
	array
) {
	/*
	 * Placer delegating placement to multiple placers
	 */
	return ctr(
		/*
		 * Constructor
		 *
		 * @param {Array}	placers		List of placers = placement implementation
		 */
		function MultiPlacers(placers) {
			this._placers = placers || [];
		},
		{
		/*
		 * Place a single node in a parent
		 *
		 * @param {Component}	child		Component
		 * @param {Component}	parent		Component
		 * @param {Object}		[options]	Placement options
		 */
		put: function(child, parent, options) {
			if (array.some(this._placers, function(placer) {
				return placer.put(child, parent, options);
			})) {
				return true;
			} else {
				console.warn("Unable to place", child, "in", parent);
				return false;
			}
		},

		/*
		 * Unplace a node from the global tree
		 *
		 * @param {Component}	node		Component
		 */
		remove: function(node, parent) {
			if (array.some(this._placers, function(placer) {
				return placer.remove(node, parent);
			})) {
				return true;
			} else {
				console.warn("Unable to unplace node", node, "from", parent);
				return false;
			}
		},

		addEach: function(children, parent) {
			if (array.some(this._placers, function(placer) {
				return placer.addEach && placer.addEach(children, parent);
			})) {
				return true;
			}
		},

		addPlacer: function(placer){
			this._placers.push(placer);
		}
	});
});
