define([
	'compose',
	'ksf/dom/Composite',
	'ksf/components/dom/List',
	'ksf/components/dom/layout/HTMLContainer',
	'./TodoCreator',
	'./TodoEditor',
	'./RemovableContainer'
], function(
	compose,
	Composite,
	List,
	HTMLContainer,
	TodoCreator,
	TodoEditor,
	RemovableContainer
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

			this._components.when('list', function(list) {
				return list.setR('value', this.getR('todoList'));
			}.bind(this));
			this._components.when('addNew', function(addNew) {
				return addNew.on('newTodo', function(newTodo) {
					this.get('todoList').add(newTodo);
				}.bind(this));
			}.bind(this));


			this._layout.configs.addEach({
				default: [
					new HTMLContainer('div'), [
						'list',
						'addNew'
					]
				]
			});
			this._layout.set('current', 'default');
		}
	);
});