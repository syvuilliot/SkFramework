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
	// c'est un domComponent dont la création du domNode est délégué à d'autres domComponents
	// on peut ainsi se contenter de manipuler les composants selon l'API KSF au lieu de manipuler directement des domNodes
	// c'est pourquoi il a l'outillage pour manipuler des composants : componentsRegistry et layoutManager

	return compose(
		CompositeBase,
		WithDomNode,
		function() {
			this._layout = new LayoutManager({ registry: this._components });

			this.style = this._style = new ObservableObject();
			this._components.asChangesStream().onValue(function(changes) {
				changes.forEach(function(change) {
					if (change.type === 'add') {
						change.value.style && change.value.style.set('name', str.hyphenate(change.key));
					} else if (change.type === 'remove') {
						// TODO: decommenter quand le bug sur change.value sera résolu
						change.value.style && change.value.style.remove('name');
					}
				});
			});
		}, {
			_applyLayout: function() {
				this._layout.apply();
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
				this._layout.get('tree').topDown(function(cmp) {
					cmp.updateRendering();
				});
			}
		}
	);
});