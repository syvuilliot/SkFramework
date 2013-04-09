define([
	'ksf/utils/constructor',
	'./Registry',
	'./ComponentFactory',	'./BindingFactory',
	'./RegistryFactoryPlacement',
	'./placement/Manager',
	'./placement/MultiPlacer',
	'./placement/samples/KsDomIn',
	'./placement/samples/InKsDom',
	'./placement/samples/DomInDom',
	'./managers/Name',	'./managers/Style',
	'./managers/TryEach',
	'dojo/dom-class',
], function(
	ctr,
	Registry,
	ComponentFactory,		BindingFactory,
	RegistryFactoryPlacement,
	PlacementManager,
	MultiPlacer,
	KsDomIn,
	InKsDom,
	DomInDom,
	NameManager,		StyleManager,
	TryEach,
	domClass
) {
	return ctr(function DomComponent(){
		this._components = new Registry();
		this._factory = new ComponentFactory({ registry: this._components });
		this._bindings = new BindingFactory({
			registry: this._components,
			componentsFactory: this._factory
		});
		this._namer = new NameManager({
			registry: this._components,
			actionner: new TryEach(
				// HtmlElement
				{execute: function(cmp, name){
					if (cmp instanceof HTMLElement){
						domClass.add(cmp, name);
						return true;
					}
				}},
				// all others
				{execute: function(cmp, name){
					cmp.name = name;
					return true;
				}}
			),
		});
		this._style = new StyleManager({
			component: 'domNode',
			registry: this._components,
			styler: domClass
		});

		this._placement = new RegistryFactoryPlacement({
			registry: this._components,
			factory: this._factory,
			root: 'domNode',
			placementManager: new PlacementManager({
				placer: new MultiPlacer([
					new DomInDom(),
					new KsDomIn(new DomInDom()),
					new InKsDom(new DomInDom()),
				]),
			}),
		});
		this._factory.add("domNode", function(){
			var domNode = document.createElement(this._domTag || "div");
			domClass.add(domNode, this.constructor.name);
			// this.name must be defined at the creation of domNode
			domClass.add(domNode, this.name);
			return domNode;
		}.bind(this));
	}, {
		get domNode() {
			return this._components.get("domNode") || this._factory.create("domNode");
		},
	});
});
