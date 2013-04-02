define([
	'ksf/utils/constructor',
	'ksf/utils/AttributeTree',	'ksf/utils/parseTree',
	'./MultiPlacers'
], function(
	ctr,
	AttributeTree,				parseTree,
	MultiPlacers
) {
	function isAttributedNode(item) {
		return Array.isArray(item) && item.length === 2 && !Array.isArray(item[1]);
	}

	function parseAttributedTree(tree, callback) {
		parseTree(tree, function(child, parent) {
			var options;
			if (isAttributedNode(child)) {
				child = child[0];
				options = child[1];
			}
			if (isAttributedNode(parent)) {
				parent = parent[0];
			}
			callback(child, parent, options);
		});
	}

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
			this._placement = new AttributeTree();
			this._configurationParser = parseAttributedTree;
		}, {
		/*
		 * Place a configuration of components
		 *
		 * @param {Tree}	placement		Tree of components
		 */
		set: function(placement) {
			// TODO: optimize placement changes using 'set' method of placers for already placed elements

			// Remove all previously placed elements
			this._placement.forEachPair(function(child, parent, options) {
				this.remove(child);
			}.bind(this));
			// Place new configuration
			parseAttributedTree(placement, function(child, parent, options) {
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
