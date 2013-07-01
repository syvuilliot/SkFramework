define([
	'ksf/utils/constructor',
	'ksf/components/DomComponent',
	'ksf/components/DomNode',
	'ksf/components/layout/FlexContainer',
	'put-selector/put'
], function (
	ctr,
	DomComponent,
	DomNode,
	FlexContainer,
	put
) {
	var WorkArea = ctr(DomComponent, function() {
		DomComponent.apply(this, arguments);

		this._componentsFactory.addEach({
			toolbar: function() {
				return new DomNode('div');
			},
			content: function() {
				return new DomNode('div');
			},
			content2: function() {
				var elmt = new DomNode('div');
				elmt.domNode.style.background = "lightgray";
				return elmt;
			}
		});

		this._bindingsFactory.addEach([
			[['toolbar'], function(elmt) {
				elmt.domNode.innerHTML = "Toolbar";
				elmt.domNode.style.padding = "1em";
				elmt.domNode.style.background = "lightblue";
			}],
			[['content'], function(elmt) {
				elmt.domNode.style.padding = "1em";
				elmt.domNode.style.background = "lightyellow";
				elmt.domNode.style.overflow = "auto";
				elmt.domNode.innerHTML = "<h1>Title</h1><h2>Title</h2><h3>Title</h3><h4>Title</h4><p>Lorem ipsum ...</p>";
			}]
		]);

		this._root = new FlexContainer({
			domNode: this._components.get('domNode')
		});
	}, {
		_doLayout: function() {
			this._layoutConfig = [
				this._root, [
					'toolbar',
					[[new FlexContainer({ orientation: 'horizontal' }), { flex: true }], [
						['content', { flex: true }],
						[['content2', { flex: true }], [
							put('h1', "Titre 1")
						]]
					]]
				]
			];
			this._root.bounds = this.bounds;
			this._layout.set(this._layoutConfig);
		}
	});

	return ctr(DomComponent, function() {
		DomComponent.apply(this, arguments);

		this._componentsFactory.addEach({
			header: function() {
				return new DomNode('div');
			},
			menu: function() {
				return new DomNode('div');
			},
			workArea: function() {
				return new WorkArea();
			},
			footer: function() {
				var node = new DomNode('div');
				node.domNode.innerHTML = "Footer";
				node.domNode.style.padding = "1em";
				node.domNode.style.background = "lightgreen";
				return node;
			}
		});

		this._bindingsFactory.addEach([
			[['header'], function(header) {
				header.domNode.innerHTML = "Header";
				header.domNode.style.padding = "1em";
				header.domNode.style.background = "lightcyan";
			}],
			[['menu'], function(menu) {
				menu.domNode.innerHTML = "Menu";
				menu.domNode.style.padding = "1em";
				menu.domNode.style.background = "lightpink";
			}]
		]);

		this._root = new FlexContainer({
			domNode: this._components.get('domNode')
		});
		this._layoutConfig = [
			this._root, [
				'header',
				[[new FlexContainer({ orientation: 'horizontal' }), { flex: true }], [
					'menu',
					['workArea', { flex: true }]
				]],
				'footer'
			]
		];
	}, {
		_doLayout: function() {
			this._root.bounds = this.bounds;
			this._layout.set(this._layoutConfig);
		}
	});
});