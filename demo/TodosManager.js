define([
	"compose/compose",
	'collections/map',
	'collections/set',
	'collections/sorted-array',
	'ksf/utils/Evented',
	'bacon.js/Bacon',
	'ksf/utils/Destroyable',
	'ksf/utils/WithGetSet',
	'ksf/utils/Observable',
	'ksf/utils/Bindable',
	'ksf/utils/ObservableObject',
	'ksf/components/HtmlElement',
	'ksf/component/CompositeDomComponent',
	'ksf/components/WithOrderedContentForHtmlElement',


	"collections/shim-array",
	"collections/listen/array-changes",
], function(
	compose,
	Map,
	Set,
	SortedArray,
	Evented,
	Bacon,
	Destroyable,
	WithGetSet,
	Observable,
	Bindable,
	ObservableObject,
	HtmlElement,
	CompositeDomComponent,
	WithOrderedContentForHtmlElement
){




	var WithEmittingChangedForHtmlElement = function(){
		// listen to dom "change" event to emit ks standardised "changed" event
		this.domNode.addEventListener("change", function(){
			this._emit("changed");
		}.bind(this));
	};
	var WithEmittingSubmitForHtmlForm = function(){
		this.domNode.addEventListener("submit", function(ev){
			ev.preventDefault();
			this._emit("submit");
		}.bind(this));
	};
	var WithEmittingSubmitForHtmlButton = function(){
		this.domNode.addEventListener("click", function(ev){
			this._emit("submit");
		}.bind(this));
	};



// ------------ APP ----------------

	var Todo = compose(
		ObservableObject,
		function(args){
			this.set("text", args.text);
			this.set("done", args.done);
		},
		{
			_doneSetter: function(done){
				this.done = !!done;
			},
		}
	);
	var not = function(fun){
		return function(item){
			return !fun(item);
		};
	};
	var itemIn = function(collection){
		return function(item){
			return collection.has(item);
		};
	};

	var ReactiveSet = compose(
		Set,
		Evented,
		Observable,
		Bindable,
		function(){
			this.addRangeChangeListener(function(){
				this._emit("changed");
			});
		}, {
			watchDiff: function(startSet){
				startSet = startSet || new Set();
				return this.asReactive().map(".clone", 1).diff(startSet, function(oldSet, newSet){
					// console.log("oldSet", oldSet.toArray());
					// console.log("newSet", newSet.toArray());
					return {
						added: newSet.difference(oldSet),
						removed: oldSet.difference(newSet),
					};
				});
			},
		}
	);

	Bacon.Property.prototype.onEach = function(){
		return this.flatMapLatest(function(iterable){
			return iterable && iterable.asReactive() || Bacon.constant(undefined);
		})
		// on each change of "iterable" create a new stream that observes all current iterable
		.flatMapLatest(function(iterable){
			return iterable && Bacon.combineAsArray(iterable.map(function(todo){
				return todo.asReactive();
			})).map(iterable) || Bacon.constant(undefined);
		});
	};

	var WithTodosForPresenter = function(args){
		var remainingTodo = function(todo){
			return !todo.get("done");
		};
		this.setR("remainingCount", this.getR("todos")
			.onEach()
			.map(".filter", remainingTodo)
			.map(".length")
			.skipDuplicates()
		);

		this.setR("stats", this.getR("remainingCount").combine(this.getR("todos", ".length").skipDuplicates(),
			function(remaining, total){
				return total ? remaining + " remaining todos out of " + total : "no todos";
			}
		));

		this.todos = new ReactiveSet();
		// demo data
		this.set("todos", [
			new Todo({text:'learn angular', done:true}),
			new Todo({text:'build an angular app', done:false}),
		]);


		// plusieurs options possibles pour écrire des 'computed properties'
/*		this.setR("total", this.getR("qty").combine(this.getR("price"), function(qty, price){
			return qty && price ? qty * price : undefined;
		}));
*/
/*		this.setR("total", Bacon.combineWith(function(qty, price){
			return qty && price ? qty * price : undefined;
		}, this.getR("qty"), this.getR("price")));
*/
/*		this.when("qty", "price", function(qty, price){
			this.set("total", qty*price);
		});
*/
		// celles là sont juste des propositions (pas terribles) de syntaxes possibles
		// this.computeR("total", multiply, "qty", "price");
		// this.bindProp("total").to(this, ["qty", "price"], multiply);
	};
	WithTodosForPresenter.prototype = {
		todoText: "",
		addTodo: function() {
			var todo = new Todo({text:this.get("todoText")});
			this.get("todos").add(todo);
			this.set("todoText", '');
		},
		removeTodo: function(todo){
			this.get("todos").delete(todo);
		},
		// en reactif, il faut remplacer ce getter par une observation de this.get("todos")
/*		_remainingGetter: function() {
			var count = 0;
			this.get("todos").forEach(function(todo) {
				count += todo.get("done") ? 0 : 1;
			});
			return count;
		},
*/		archive: function() {
			var todos = this.get("todos");
			var doneTodos = todos.filter(function(todo){
				return todo.get("done");
			});
			todos.deleteEach(doneTodos);
		},
		_todosSetter: function(todos){
			var reactiveSet = this.get("todos");
			reactiveSet.clear();
			reactiveSet.addEach(todos);
		},
	};

	// mixin qui permet de réagir à la modification d'un Set de façon unitaire (ajout ou suppression d'un item à la fois)
	var WithSetObservingGenerator = function(args){
		var PROP = "value";
		var ADD_ITEM = "addItem";
		var REMOVE_ITEM = "removeItem";

		return function(){
			var oldValue;
			this.getR(PROP).flatMapLatest(function(value){
				var stream = value && value.watchDiff && value.watchDiff(oldValue) || Bacon.constant({
					removed: oldValue && oldValue.toArray && oldValue.toArray() || [],
					added: [],
				});
				oldValue = value;
				return stream;
			}).onValue(function(diff){
				diff.removed.forEach(this[REMOVE_ITEM], this);
				diff.added.forEach(this[ADD_ITEM], this);
			}.bind(this));
		};
	};


	// mixin qui permet de réagir à la modification d'un Set en une fois (ajout et suppression de plusieurs items)
	var WithSetBulkObservingGenerator = function(args){
		var PROP = "value";
		var SWAP_ITEMS = "swapItems";

		return function(){
			var oldValue;
			this.getR(PROP).flatMapLatest(function(value){
				var stream = value && value.watchDiff && value.watchDiff(oldValue) || Bacon.constant({
					removed: oldValue && oldValue.toArray && oldValue.toArray() || [],
					added: [],
				});
				oldValue = value;
				return stream;
			}).onValue(function(diff){
				this[SWAP_ITEMS](diff.added, diff.removed);
			}.bind(this));
		};
	};


	var sortedItems = window.sortedItems = new SortedArray([
			new Todo({text:'learn angular', done:true}),
			new Todo({text:'build an angular app', done:false}),
	], null, function(a, b){
		return Object.compare(a.text, b.text);
	});


	var List = compose(
		HtmlElement,
		WithOrderedContentForHtmlElement,
		function(){
			this._item2cmp = new Map();
		},
		{
			// remplace le setter par défaut qui enregsitre sur le domNode
			_factorySetter: function(factory){
				this._factory = factory;
			},
			_valueSetter: function(value){
				this.value = value;
			},
			_valueGetter: function(){
				return this.value;
			},
			_addItem: function(item){
				var cmp = this.factory(item);
				this._item2cmp.set(item, cmp);
				// this.addChild(cmp);
				// this.set("content", this._item2cmp.toArray());
			},
			_removeItem: function(item){
				var cmp = this._item2cmp.get(item);
				// this.removeChild(cmp);
				this._item2cmp.delete(item);
				cmp.destroy && cmp.destroy();
				// this.set("content", this._item2cmp.toArray());
			},
			swapItems: function(added, removed){
				// TODO: don't process items that could be in removed and in added
				removed.forEach(this._removeItem, this);
				added.forEach(this._addItem, this);
				this.set("content", this._item2cmp.toArray());
				this.updateRendering();
			},
/*			removeAllItems: function(){
				this._item2cmp.keys().forEach(this.removeItem, this);
			},
*/		}, {
			destroy: function(){
				this.removeAllItems();
				HtmlElement.prototype.destroy.call();
			},
		},
		WithSetBulkObservingGenerator()
	);

	var SimpleContainer = compose(
		HtmlElement,
		WithOrderedContentForHtmlElement,
		{
			_contentSetter: function(cmps){
				WithOrderedContentForHtmlElement.prototype._contentSetter.call(this, cmps);
				this.updateRendering();
			},

		}
	);

	var TodosManager = compose(
		CompositeDomComponent,
/*		WithDeclarative.create({
			factories: {
					presenter: function(){
						return compose.create(Stateful, WithTodosForPresenter);
					},
					root: function(){
						return new HtmlElement({tag: "div"});
					},
					title: function(){
						return new HtmlElement({
							tag: "h2",
							value: "Todos",
						});
					},
			},
			layouts: {
			}
		}),
*/		function(){
			var cmps = this._components;

			var presenter = window.presenter = compose.create(ObservableObject, Destroyable, WithTodosForPresenter);
			this._components.addEach({
				presenter: presenter,
			});

			this._components.factories.addEach({
				root: function(){
					return new SimpleContainer({tag: "div"});
				},
				title: function(){
					return new HtmlElement({
						tag: "h2",
						innerHTML: "Todos",
					});
				},
				subTitle: function(){
					return new HtmlElement({tag: "span"});
				},
				todoList: function(){
					return new List({
						tag: "ul",
						factory: function(todo){
							// ici on ne crée volontairement pas un composant composite qui encapsule ces sous-composants car on veut, par simplicité, que ces sous-composants appartiennent au todoManager (et pas à list).
							// cela permet de binder directement les propriétés des composants au presenter de todoManager (comme dans l'exemple angularJS)
							var container = new SimpleContainer({tag: "li"});
							var textDisplayer = new compose(HtmlElement, WithEmittingChangedForHtmlElement)({tag: "input"});
							var doneEditor = new compose(HtmlElement, WithEmittingChangedForHtmlElement)({tag: "input", type: "checkbox"});
							var deleteButton = new compose(HtmlElement, WithEmittingSubmitForHtmlButton)({tag: "button", innerHTML: "X"});
							// la question est de savoir comment les enregistrer dans le registre du todoManager... ou faut-il le déléguer à "list" ?
							cmps.addEach([container, textDisplayer, doneEditor, deleteButton]);
							container.set("content", [doneEditor, textDisplayer, deleteButton]);

							// on enregistre les cancelers sur le container car on sait que c'est un destroyable et qu'il sera détruit lorsque la todo sortira de la liste
							container.own(textDisplayer.bind("value", "<<->", todo, "text"));
							container.own(doneEditor.bind("checked", "<<->", todo, "done"));
							container.own(deleteButton.on("submit", function(){
								presenter.removeTodo(todo);
							}));
							return container;
						},
					});
				},
				newTodoForm: function(){
					return new compose(SimpleContainer, WithEmittingSubmitForHtmlForm)({tag: "form"}); // new Form(); // TODO: create a Form component
				},
				newTodoText: function(){
					return new compose(HtmlElement, WithEmittingChangedForHtmlElement)({tag: "input", placeholder: "add new todo"});
				},
				addTodoButton: function(){
					return new HtmlElement({tag: "button", type: "submit", innerHTML: "add"});
				},
			});

			// bindings
			this._components.when("presenter", "subTitle", function(presenter, subTitle){
				return subTitle.setR("innerHTML", presenter.getR("stats"));
			});
			this._components.bindValue("presenter", "todos", "todoList", "value");
			this._components.syncValue("presenter", "todoText", "newTodoText", "value");
			this._components.bindEvent("newTodoForm", "submit", "presenter", "addTodo");

			// layout
/*			this._layout.configs.addEach({
				default:
					[["root"], [
						["title"],
						["subTitle"],
						["todoList"],
						["newTodoForm"], [
							["newTodoText"],
							["addTodoButton"],
						],
					]],
			});
			this._layout.set("default");
*/			// manual layout to be removed
			this.domNode = this._components.get("root").domNode;
			cmps.get("root").set("content", [
				cmps.get("title"),
				cmps.get("subTitle"),
				cmps.get("todoList"),
				cmps.get("newTodoForm"),
			]);
			cmps.get("root").updateRendering();
			cmps.get("newTodoForm").set("content", [
				cmps.get("newTodoText"),
				cmps.get("addTodoButton"),
			]);
			cmps.get("newTodoForm").updateRendering();

		},
		{
			_todosSetter: function(todos){
				this._components.get("presenter").set("todos", todos);
			},
			_todosGetter: function(todos){
				return this._components.get("presenter").get("todos");
			},
		}
	);


	return TodosManager;
});