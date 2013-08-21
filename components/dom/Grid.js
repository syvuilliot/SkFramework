define([
	'compose',
	'ksf/dom/composite/Composite',
	'ksf/components/dom/List',
	'ksf/components/dom/ActiveList',
	'ksf/components/dom/layout/HtmlContainer',
	'ksf/components/dom/HtmlElement',
	'ksf/utils/bindProps',
], function(
	compose,
	Composite,
	List,
	ActiveList,
	HtmlContainer,
	HtmlElement,
	bindProps
){
	return compose(
		Composite,
		function() {
			var self = this;
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
					var body = new ActiveList('tbody', {
						factory: function(item){
							var row = new List('tr', {
								factory: function(column){
									return new HtmlContainer('td', {
										content: [column.body.factory(item)],
									});
								},
							});
							row.bind('value', body, 'columns');
							row._activeSetter = function(value){
								this._active = !!value;
								if (value){
									this.style.set('active', 'active');
								} else {
									this.style.remove('active');
								}
							};
							row._activeGetter = function(){
								return this._active;
							};
							row.get("domNode").addEventListener("click", function(){
								row.set("active", !row.get("active"));
							});
							return row;
						},
					});
					return body;
				},
			});

			this._components.when('head',
				bindProps('value', '<', 'columns').bind(self)
			);
			this._components.when('body', [
				bindProps('value', '<', 'value').bind(self),
				bindProps('columns', '<', 'columns').bind(self),
				bindProps('active', '<<->', 'active').bind(self),
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