define([
	'compose',
	'../base/Composite',
	'./LayoutManager',
	'./WithDomNode'
], function(
	compose,
	CompositeBase,
	LayoutManager,
	WithDomNode
){
	return compose(
		CompositeBase,
		WithDomNode,
		function() {
			this._layout = new LayoutManager({ registry: this._components });
		}, {
			_applyLayout: function() {
				this._layout.apply(this._layout.get('current'));
			},

			createRendering: function() {
				this._applyLayout();
				this.set('domNode', this._layout.get('root').get('domNode'));
			},

			updateRendering: function() {
				this._applyLayout();
				this._layout.get('tree').bottomUp(function(cmp) {
					cmp.updateRendering();
				});
			}
		}
	);
});