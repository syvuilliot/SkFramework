define([
	'ksf/utils/constructor',
	'./Manager',
	'./placement/Manager',
	'ksf/utils/proxyFunctions',
], function(
	ctr,
	Manager,
	PlacementManager,
	proxy
) {

	return ctr(function UIComponent() {
		this._components = new Manager();
		this._placement = new PlacementManager();
	}, {
		_setPlacement: function(idTree){
			// map tree of id to tree of components
			// be sure that all components to be placed are created or create them
			var mapFunction = function(value){
				if (Array.isArray(value)) {
					return value.map(mapFunction, this);
				} else {
					return this._components.get(value) || this._components.create(value);
					//
				}
			};
			var cmpTree = idTree.map(mapFunction, this);

			// var unplaced = this._placement.delta(cmpTree)[0];
			// do the placement
			this._placement.set(cmpTree);
			// delete all unplaced components
			// unplaced.forEach(this._components._delete, this);
		},
		// create (if necessary) and place (call placer and register placement) one component
		_place: function(component, container, options) {
			component = this._components.get(component) || this._components.create(component);
			container = this._components.get(container);
			if (!component) {
				throw "Cannot place an unknown component";
			}
			this._placement.add(component, container, options);
		},
		// unplace one component
		_unplace: function(component) {
			component = this._components.get(component);
			if (!component) {
				throw "Cannot unplace unknown component";
			}
			this._placement.remove(component);
		},
		_delete: function(component){
			this._unplace(component);
			this._components.delete(component);
		},
	});


});
