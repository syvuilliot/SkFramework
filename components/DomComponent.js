define([
	'ksf/utils/constructor',
	'ksf/utils/IndexedSet',
	"ksf/component/_RegistryWithFactory",
	"ksf/component/MultiFactories",
	'ksf/component/BindingFactory',
	'collections/map',
	'ksf/component/layout/TreeById',
	'ksf/component/layout/Tree',
	'ksf/component/layout/MultiPlacer',
	'ksf/component/layout/samples/KsDomIn',
	'ksf/component/layout/samples/InKsDom',
	'ksf/component/layout/samples/DomInDom',
	'ksf/component/layout/samples/KsDomInContainer',
	'ksf/component/managers/Name',	'ksf/component/managers/DomClass',
	'ksf/component/managers/TryEach',
	'dojo/dom-class',
	'ksf/utils/string'
], function(
	ctr,
	IndexedSet,
	_RegistryWithFactory,
	MultiFactories,
	BindingFactory,
	Map,
	TreeByIdPlacer,
	TreePlacer,
	MultiPlacer,
	KsDomIn,
	InKsDom,
	DomInDom,
	KsDomInContainer,
	NameManager,					DomClassManager,
	TryEach,
	domClass,
	str
) {
	return ctr(function DomComponent() {
		this._components = new IndexedSet();
		this._componentsFactory = new MultiFactories({
			factories: new Map()
		});
		
		_RegistryWithFactory.call(this._components, {
			factory: this._componentsFactory,
		});
		_RegistryWithFactory.applyPrototype.call(this._components);

		this._bindingsFactory = new BindingFactory({
			components: this._components,
			binder: {
				bind: function(factory, cmps) {
					return factory.apply(undefined, cmps);
				},
				unbind: function(bindReturn) {
					if (!bindReturn) { return; }
					if (!bindReturn.forEach) {
						bindReturn = [bindReturn];
					}
					bindReturn.forEach(function(ret) {
						if (ret.remove) {
							ret.remove();
						} else {
							ret();
						}
					});
				}
			}
		});

		this._namer = new NameManager({
			registry: this._components,
			convert: function(id) {
				return str.hyphenate(id);
			},
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
		this.style = new DomClassManager({
			componentId: 'domNode',
			registry: this._components,
			styler: domClass
		});
		this.style.set([this._componentName || this.constructor.name]);

		this._state = new DomClassManager({
			componentId: 'domNode',
			registry: this._components,
			styler: domClass
		});

		var layoutRegistry = Object.create(this._components);
		var origGet = this._components.get;
		layoutRegistry.get = function(cmp) {
			if (typeof(cmp) != 'string') {
				return cmp;
			} else {
				return origGet.apply(this, arguments);
			}
		};
		this._layout = new TreeByIdPlacer({
			registry: layoutRegistry,
			placementManager: new TreePlacer({
				placer: new MultiPlacer([
					new DomInDom(),
					new KsDomIn(new DomInDom()),
					new InKsDom(new DomInDom()),
					new KsDomInContainer()
				]),
			}),
		});
		this._componentsFactory.add(function(){
			return document.createElement(this._domTag);
		}.bind(this), 'domNode');
	}, {
		_domTag: 'div',

		get domNode() {
			return this._components.get("domNode");
		},
		get name() {
			return this._name;
		},
		set name(val) {
			this.style.remove(this._name);
			this.style.add(val);

			this._name = val;
		},

		_doLayout: function() {},

		render: function() {
			this._doLayout();
			this.domNode.style.width = this.bounds && this.bounds.width && (this.bounds.width + 'px'),
			this.domNode.style.height = this.bounds && this.bounds.height && (this.bounds.height + 'px');
		},

		get bounds () {
			return this._bounds;
		},

		set bounds (bounds) {
			this._bounds = bounds;
		},

		preferredSize: function() {
			var size,
				oldBounds = this.bounds;
			this.bounds = { height: null, width: null };
			this.render();
			size = {
				height: this.domNode.offsetHeight,
				width: this.domNode.offsetWidth
			};
			this.bounds = oldBounds;
			return size;
		}
	});
});
