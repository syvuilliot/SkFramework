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
		_setPlacement: function(placement){
			// be sure that all components to be placed are created or create them
			this._placement.set(placement);
			// delete all non placed components
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
		_deleteEach: function(cmps){
			cmps.forEach(this._delete, this);
		}
	});


});
