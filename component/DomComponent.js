define([
	'ksf/utils/constructor',
	'./Registry',
	'./ComponentFactory',	'./BindingFactory',
	'./RegistryFactoryPlacement',
	'./placement/Manager',
	'./placement/PlacerWithIdClass',
	'./placement/MultiPlacer',
	'./placement/samples/KsDomIn',
	'./placement/samples/InKsDom',
	'./placement/samples/DomInDom',
], function(
	ctr,
	Registry,
	ComponentFactory,		BindingFactory,
	RegistryFactoryPlacement,
	PlacementManager,
	PlacerWithIdClass,
	MultiPlacer,
	KsDomIn,
	InKsDom,
	DomInDom
) {
	return ctr(function DomComponent(){
		this._components = new Registry();
		this._factory = new ComponentFactory({ registry: this._components });
		this._bindings = new BindingFactory({
			registry: this._components,
			componentsFactory: this._factory
		});

		var domInDomPlacerWithClass = new PlacerWithIdClass({
			placer: new DomInDom(),
			registry: this._components,
		});
		this._placement = new RegistryFactoryPlacement({
			registry: this._components,
			factory: this._factory,
			root: 'domNode',
			placementManager: new PlacementManager({
				placer: new MultiPlacer([
					domInDomPlacerWithClass,
					new KsDomIn(domInDomPlacerWithClass),
					new InKsDom(domInDomPlacerWithClass)
				])
			})
		});
		this._factory.add("domNode", function(){
			return document.createElement(this._domTag || "div");
		}.bind(this));
	}, {
		get domNode() {
			return this._components.get("domNode") || this._factory.create("domNode");
		}
	});
});
