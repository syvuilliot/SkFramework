define([
	'ksf/utils/constructor',
	'ksf/utils/AttributeTree'
], function(
	ctr,
	Tree
) {

	/*
	 * Placement manager
	 */
	return ctr(
		/*
		 * Constructor
		 *
		 * @param {Array}	placers		List of Placer = placement implementations
		 */
		function PlacementManager(args) {
			this.placer = args.placer;
			this._placement = new Tree();
		}, {
		/*
		 * Place a configuration of components
		 *
		 * @param {Tree}	tree	Tree
		 */
		set: function(tree) {
			// convert literal placementTree to a tree
			var placementTree = new Tree(tree);
			// TODO: optimize placement changes using 'set' method of placers for already placed elements

			// Remove all previously placed elements
			this._placement.forEach(function(child, parent, options) {
				parent && this.remove(child, parent);
			}.bind(this));
			// Place new configuration
			placementTree.forEach(function(child, parent, options) {
				parent && this.add(child, parent, options);
			}.bind(this));
		},

		add: function(child, parent, options) {
			this.placer.put(child, parent, options);
			this._placement.set(child, parent, options);
		},

		remove: function(child, parent) {
			if (this._placement.has(child, parent)) {
				this.placer.remove(child, parent);
				this._placement.remove(child, parent);
			}
		}
	});
});
