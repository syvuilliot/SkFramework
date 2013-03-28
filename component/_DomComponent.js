define([
	'ksf/utils/createConstructor',
	'./DomManager'
], function(
	ctr,
	DomManager
) {
	/*
	 * Component using a DOM-node as view
	 */
	var ctor = ctr(
		function _DomComponent(params) {
			this._components = new DomManager();
		}, {
			_place: function(child, options) {
				this._components.place(child, this.domNode, options);
			},

			_placeEach: function(children) {
				this._components.placeEach(children, this.domNode);
			},

			_unplace: function(child, options) {
				this._components.unplace(child, this.domNode, options);
			},

			_unplaceEach: function(children) {
				this._components.unplaceEach(children, this.domNode);
			}
		}
	);

	Object.defineProperty(ctor.prototype, 'domNode', {
		get: function(){
			return this._components.get('domNode');
		}
	});
	return ctor;
});