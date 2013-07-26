define([
	'compose',
	'../../base/Composite',
	'../../collections/ObservableObject',
	'../WithDomNode',
	'./LayoutManager',
], function(
	compose,
	CompositeBase,
	ObservableObject,
	WithDomNode,
	LayoutManager
){
	return compose(
		CompositeBase,
		WithDomNode,
		function() {
			this._layout = new LayoutManager({ registry: this._components });

			this._style = new ObservableObject();
		}, {
			_applyLayout: function() {
				this._layout.apply(this._layout.get('current'));
			},

			_applyStyle: function() {
				this._layout.get('root').set('style', this._style);
			},

			createRendering: function() {
				this._applyLayout();
				this._applyStyle();
				this.set('domNode', this._layout.get('root').get('domNode'));
			},

			updateRendering: function() {
				this._applyLayout();
				this._applyStyle();
				this._layout.get('tree').bottomUp(function(cmp) {
					cmp.updateRendering();
				});
			}
		}
	);
});