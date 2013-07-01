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

			placementTree.forEachParent(function(parent, children) {
				this.addEach(children.map(function(child) {
					return [child, placementTree.getAttribute(child, parent)];
				}), parent);
			}.bind(this));
		},

		addEach: function(children, parent) {
			var rendered = false;
			if (this.placer.addEach) {
				rendered = this.placer.addEach(children, parent);
			}

			this._placement.getChildren(parent).forEach(function(child) {
				this.remove(child, parent, !rendered);
			}.bind(this));

			children.forEach(function(childAndOptions) {
				this.add(childAndOptions[0], parent, childAndOptions[1], !rendered);
			}.bind(this));
		},

		add: function(child, parent, options, render) {
			render && parent && this.placer.put(child, parent, options);
			this._placement.set(child, parent, options);
		},

		remove: function(child, parent, render) {
			if (this._placement.has(child, parent)) {
				render && parent && this.placer.remove(child, parent);
				this._placement.remove(child, parent);
			}
		}
	});
});
