define([
	'compose',
	'ksf/dom/composite/Composite',
	'ksf/components/dom/List',
	'ksf/components/dom/layout/HtmlContainer',
	'./TodoCreator',
	'./TodoEditor',
	'./RemovableContainer',
	'ksf/utils/bindProps',
], function(
	compose,
	Composite,
	List,
	HtmlContainer,
	TodoCreator,
	TodoEditor,
	RemovableContainer,
	bindProps
){
	return compose(
		Composite,
		function() {
			this._components.factories.addEach({
				list: function() {
					return new List('ul', {
						factory: function(item) {
							return new RemovableContainer({
								content: new TodoEditor(item),
								removeCallback: function() {
									var list = this.get('todoList');
									list.remove(list.indexOf(item));
								}.bind(this)
							});
						}.bind(this)
					});
				}.bind(this),
				addNew: function() {
					return new TodoCreator();
				}
			});

			var self = this;
			this._components.when('list',
				bindProps('value', '<', 'todoList').bind(self)
			);
			this._components.when('addNew', function(addNew) {
				return addNew.on('newTodo', function(newTodo) {
					self.get('todoList').add(newTodo);
				});
			});

			this._style.set('base', 'TodoListManager');

			this._layout.set('config', [
				new HtmlContainer('div'), [
					'addNew',
					'list',
				]
			]);
		}
	);
});