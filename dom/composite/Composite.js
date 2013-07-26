define([
	'compose',
	'../../base/Composite',
	'../../collections/ObservableObject',
	'../WithDomNode',
	'./LayoutManager',
	'ksf/utils/string'
], function(
	compose,
	CompositeBase,
	ObservableObject,
	WithDomNode,
	LayoutManager,
	str
){
	return compose(
		CompositeBase,
		WithDomNode,
		function() {
			this._layout = new LayoutManager({ registry: this._components });

			this.style = this._style = new ObservableObject();
			this._components.asStream('changes').onValue(function(changes) {
				changes.forEach(function(change) {
					if (change.type=== 'add') {
						change.value.style && change.value.style.set('name', str.hyphenate(change.key));
					} else {
						// remove
						change.value.style && change.value.style.remove('name');
					}
				});
			});
		}, {
			_applyLayout: function() {
				this._layout.apply(this._layout.get('current'));
			},

			_applyStyle: function() {
				this.style.forEach(function(value, category) {
					this._layout.get('root').style.set(category, value);
				}, this);
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