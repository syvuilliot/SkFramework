<define([
	'ksf/utils/constructor',
	'ksf/utils/AttributeTree',
	'./MultiPlacers'
], function(
	ctr,
	Tree,
	MultiPlacers
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
		function PlacementManager(placers) {
			this._placer = new MultiPlacers(placers);
			this._placement = new Tree();
		}, {
		/*
		 * Place a configuration of components
		 *
		 * @param {Tree}	placement		Tree of components
		 */
		set: function(placementTree) {
			// convert literal placementTree to a tree
			placementTree = new Tree(placementTree);
			// TODO: optimize placement changes using 'set' method of placers for already placed elements

			// Remove all previously placed elements
			this._placement.forEach(function(child, parent, options) {
				parent && this.remove(child);
			}.bind(this));
			// Place new configuration
			placementTree.forEach(function(child, parent, options) {
				parent && this.add(child, parent, options);
			}.bind(this));
		},

		add: function(child, parent, options) {
			this._placer.put(child, parent, options);
			this._placement.set(child, parent, options);
		},

		remove: function(child) {
			this._placer.remove(child, this._placement.getParent(child));
			this._placement.remove(child);
		},

		addPlacer: function(placer){
			this._placer.addPlacer(placer);
		},

		isPlaced: function(cmp){
			return this._placement.has(cmp);
		}
		// TODO ?
		// get

	});
});
