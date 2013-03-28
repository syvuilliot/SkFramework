define([
	'ksf/utils/createConstructor',
	'ksf/utils/AttributeTree'
], function(
	ctr,
	AttributeTree
) {
	/*
	 * Placer delegating placement to multiple placers
	 */
	 return ctr(
		/*
		 * Constructor
		 * 
		 * @param {Array}	placer		Placer = placement implementation
		 */
		function PlacementManager(placer) {
			this._placer = placer;
			this._placement = new AttributeTree();
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
			this._placement.set(child, parent, options);
			this._placer.put(child, parent, options);
		},

		/*
		 * Configure placed child
		 */
		set: function(child, options) {
			this._placer.set(child, this._placement.get(child), options);
		},

		/*
		 * Unplace a node from the global tree
		 *
		 * @param {Component}	child		Component
		 */
		remove: function(child) {
			this._placer.remove(child, this._placement.getParent(child), this._placement.getAttribute(child));
			this._placement.remove(child);
		}
	});
});
