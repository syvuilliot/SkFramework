define([
	'ksf/utils/constructor',
	'ksf/utils/IndexedSet',
	"ksf/component/_RegistryWithFactory",
	"ksf/component/MultiFactories",
	'ksf/component/BindingManager',
	'ksf/component/BindingFactories',
	'collections/map',
	'ksf/component/layout/TreeById',
	'ksf/component/layout/Tree',
	'ksf/component/layout/MultiPlacer',
	'ksf/component/layout/samples/KsDomIn',
	'ksf/component/layout/samples/InKsDom',
	'ksf/component/layout/samples/DomInDom',
	'ksf/component/managers/Name',	'ksf/component/managers/Style',
	'ksf/component/managers/TryEach',
	'dojo/dom-class'
], function(
	ctr,
	IndexedSet,
	_RegistryWithFactory,
	MultiFactories,
	BindingManager,
	BindingFactories,
	Map,
	TreeByIdPlacer,
	TreePlacer,
	MultiPlacer,
	KsDomIn,
	InKsDom,
	DomInDom,
	NameManager,		StyleManager,
	TryEach,
	domClass
) {
	return ctr(function DomComponent() {
		this._components = new IndexedSet();
		this._componentsFactories = new Map();
		/*
		this._componentsFactories = new (ctr(Map, function() {
			Map.apply(this, arguments);
		}, {
			get: function(key) {
				var factory = Map.prototype.get.apply(this, arguments);
				return factory || key;
			}
		}));
		*/
		var componentsFactory = new MultiFactories({
			factories: this._componentsFactories
		});
		
		_RegistryWithFactory.call(this._components, {
			factory: componentsFactory,
		});
		_RegistryWithFactory.applyPrototype.call(this._components);

		this._bindings = new BindingManager({
			components: this._components,
		});
		this._bindingFactories = new BindingFactories({
			components: this._components,
			bindings: this._bindings,
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

		this._layout = new TreeByIdPlacer({
			registry: this._components,
			root: 'domNode',
			placementManager: new TreePlacer({
				placer: new MultiPlacer([
					new DomInDom(),
					new KsDomIn(new DomInDom()),
					new InKsDom(new DomInDom()),
				]),
			}),
		});
		this._componentsFactories.set("domNode", function(){
			return document.createElement(this._domTag);
		}.bind(this));

		this._bindingFactories.add('domNode', function(domNode) {
			this._init();
		}.bind(this));

		this._bindingFactories.add(['domNode'], function(domNode) {
			domClass.add(domNode, this.constructor.name);
			this.name && domClass.add(domNode, this.name);
		}.bind(this));
	}, {
		_domTag: 'div',

		get domNode() {
			return this._components.get("domNode");
		},
		get name() {
			return this._name;
		},
		set name(val) {
			if (this._components.hasKey('domNode')) {
				this._name && domClass.remove(this.domNode, this._name);
				domClass.add(this.domNode, val);
			}
			this._name = val;
		},

		_init: function() {}
	});
});
