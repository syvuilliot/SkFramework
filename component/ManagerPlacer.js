define([
	'ksf/utils/constructor',
	'./Manager',
	'./placement/MultiPlacers',
	'ksf/utils/AttributeTree',
	'ksf/utils/proxyFunctions',
	'ksf/utils/parseTree',
], function(
	ctr,
	Manager,
	MultiPlacers,
	AttributeTree,
	proxy,
	parseTree
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

	var ManagerPlacer = ctr(function(params) {
		this._placer = new MultiPlacers(params.placers);
		this._placement = new AttributeTree();
		this._registry = new Manager();
	}, {
		setPlacement: function(placement){
			// TODO: parse placement tree and call this.place and this.unplace
		},
		// create (if necessary) and place (call placer and register placement)
		place: function(component, container, options) {
			component = this._registry.get(component) || this._registry.create(component);
			container = this._registry.get(container);
			if (!component) {
				throw "Cannot place an unknown component";
			}
			this._placer.put(component, container, options);
			this._placement.set(component, container, options);
		},
		// unplace
		unplace: function(component) {
			component = this._registry.get(component);
			if (!component) {
				throw "Cannot unplace unknown component";
			}
			this._placer.remove(component, this._placement.getParent(component));
			this._placement.remove(component);
		},
		delete: function(component){
			this.unplace(component);
			this._registry.delete(component);
		},
		deleteEach: function(cmps){
			cmps.forEach(this.delete, this);
		}
	});

	proxy.methods(ManagerPlacer.prototype, "_registry", [
		"addComponentFactory",
		"addEachComponentFactory",
		"addBindingsFactory",
		"addEachBindingsFactory",
		"create",
		"createEach",
		"get",
	]);

	return ManagerPlacer;
});
