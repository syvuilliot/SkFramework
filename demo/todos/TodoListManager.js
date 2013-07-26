define([
	'compose',
	'ksf/dom/composite/Composite',
	'ksf/components/dom/List',
	'ksf/components/dom/layout/HtmlContainer',
	'./TodoCreator',
	'./TodoEditor',
	'./RemovableContainer'
], function(
	compose,
	Composite,
	List,
	HtmlContainer,
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


			var bindTwoProps = function(prop1, dir, prop2) {
				return function() {
					var cmp1 = arguments[0],
						cmp2;
					if (arguments.length > 2) { return; }
					if (arguments.length === 1) {
						cmp2 = this;
					}
					if (arguments.length === 2) {
						cmp2 = arguments[1];
					}
					if (dir === '<') {
						return cmp1.setR(prop1, cmp2.getR(prop2));
					}
				};
			};

			this._components.when('list',
				bindTwoProps('value', '<', 'todoList').bind(this)
			);
			var self = this;
			this._components.when('addNew', function(addNew) {
				return addNew.on('newTodo', function(newTodo) {
					self.get('todoList').add(newTodo);
				});
			});

			this._style.set('base', 'TodoListManager');

			this._layout.configs.addEach({
				default: [
					new HtmlContainer('div'), [,
						'addNew',
						'list',
					]
				]
			});
			this._layout.set('current', 'default');
		}
	);
});