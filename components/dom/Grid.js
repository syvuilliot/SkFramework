define([
	'compose',
	'ksf/dom/composite/Composite',
	'ksf/components/dom/List',
	'ksf/components/dom/layout/HtmlContainer',
	'ksf/components/dom/HtmlElement',
	'ksf/utils/bindProps',
], function(
	compose,
	Composite,
	List,
	HtmlContainer,
	HtmlElement,
	bindProps
){
	return compose(
		Composite,
		function() {
			this._components.factories.addEach({
				head: function() {
					return new List('tr', {
						factory: function(column) {
							return new HtmlElement('th', {
								innerHTML: column.head.label,
							});
						},
					});
				},
				body: function() {
					var body = new List('tbody', {
						factory: function(item){
							var row = new List('tr', {
								factory: function(column){
									var td = new HtmlContainer('td', {
										content: column.body.factory(item),
									});
									td.set('content', [column.body.factory(item)]);
									return td;
								},
							});
							row.bind('value', body, 'columns');
							return row;
						},
					});
					return body;
				},
			});

			var self = this;
			this._components.when('head',
				bindProps('value', '<', 'columns').bind(self)
			);
			this._components.when('body', [
				bindProps('value', '<', 'value').bind(self),
				bindProps('columns', '<', 'columns').bind(self),
			]);


			// this._style.set('base', 'TodoListManager');

			this._layout.set('config', [
				new HtmlContainer('table'), [[
					new HtmlContainer('thead'), [
						'head',
					]],
					'body',
				]
			]);
		}
	);
});