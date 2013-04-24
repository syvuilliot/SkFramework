define([
	'ksf/utils/constructor',
	'ksf/component/Registry',
	'ksf/component/ComponentFactory',	'ksf/component/BindingFactory',
	'ksf/component/RegistryFactoryPlacement',
	'ksf/component/placement/Manager',
	'ksf/component/placement/MultiPlacer',
	'ksf/component/placement/samples/KsDomIn',
	'ksf/component/placement/samples/InKsDom',
	'ksf/component/placement/samples/DomInDom',
	'ksf/component/managers/Name',	'ksf/component/managers/Style',
	'ksf/component/managers/TryEach',
	'dojo/dom-class',
	'ksf/utils/string'
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
	domClass,
	str
) {
	return ctr(function DomComponent(){
		this._components = new Registry();
		this._factory = new ComponentFactory({ registry: this._components });
		this._bindings = new BindingFactory({
			registry: this._components
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
					if ('name' in cmp) {
						cmp.name = name;
						return true;
					}
				}},
				// all others
				{execute: function(cmp, name){
					if ('domNode' in cmp) {
						domClass.add(cmp.domNode, name);
						return true;
					}
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
			return document.createElement(this._domTag);
		}.bind(this));

		this._bindings.add(['domNode'], function(domNode) {
			this._layout();
		}.bind(this));

		this._bindings.add(['domNode'], function(domNode) {
			domClass.add(domNode, str.hyphenate(this.constructor.name));
			this.name && domClass.add(domNode, this.name);
		}.bind(this));
	}, {
		_domTag: 'div',

		get domNode() {
			return this._components.get("domNode") || this._factory.create("domNode");
		},
		get name() {
			return this._name;
		},
		set name(val) {
			if (this._components.has('domNode')) {
				this._name && domClass.remove(this.domNode, this._name);
				domClass.add(this.domNode, val);
			}
			this._name = val;
		},

		_layout: function() {}
	});
});
