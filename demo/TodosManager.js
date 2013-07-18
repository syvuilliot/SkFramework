define([
	"compose/compose",
	'collections/map',
	'collections/set',
	'collections/list',
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
	List,
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
			this.addRangeChangeListener(function(added, removed){
				var addChanges = added.map(function(item){
					return {
						type: "add",
						value: item,
					};
				});
				var removeChanges = removed.map(function(item){
					return {
						type: "remove",
						value: item,
					};
				});
				var changes = removeChanges.concat(addChanges);
				this._changesQueue = this._changesQueue ? this._changesQueue.concat(changes) : changes;
				if (! this._changing){
					this._emit("changes", this._changesQueue);
					delete this._changesQueue;
					this._emit("changed");
				}
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
		}, {
			addEach: function(values){
				this._startChanges();
				Set.prototype.addEach.call(this, values);
				this._stopChanges();
			},
			_startChanges: function(){
				this._changing = true;
			},
			_stopChanges: function(){
				this._changing = false;
				this._emit("changes", this._changesQueue);
				delete this._changesQueue;
				this._emit("changed");
			},
		}
	);

	var ReactiveList = window.ReactiveList = compose(
		List,
		Evented,
		Observable,
		Bindable,
		function(){
			this.addRangeChangeListener(function(added, removed){
				var addChanges = added.map(function(item){
					return {
						type: "add",
						value: item,
					};
				});
				var removeChanges = removed.map(function(item){
					return {
						type: "remove",
						value: item,
					};
				});
				var changes = removeChanges.concat(addChanges);
				this._changesQueue = this._changesQueue ? this._changesQueue.concat(changes) : changes;
				if (! this._changing){
					this._emit("changes", this._changesQueue);
					delete this._changesQueue;
					this._emit("changed");
				}
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
		}, {
/*			clear: function(){
				var values = this.toArray();
				Set.prototype.clear.call(this);
				this.dispatchRangeChange([], values);
			},
*/			addEach: function(values){
				this._startChanges();
				Set.prototype.addEach.call(this, values);
				this._stopChanges();
			},
			_startChanges: function(){
				this._changing = true;
			},
			_stopChanges: function(){
				this._changing = false;
				this._emit("changes", this._changesQueue);
				delete this._changesQueue;
				this._emit("changed");
			},
		}
	);


	Bacon.Property.prototype.onChanged = function(){
		return this.flatMapLatest(function(iterable){
			return iterable && iterable.asReactive() || Bacon.constant(undefined);
		});
	};
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
		this.toggleLive();

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
		archive: function() {
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
		toggleLive: function(){
			var newState = !this.get("reactive");
			this.setEach({
				"reactive": newState,
				"liveButtonText": newState ? "Stop live" : "Start live",
			});
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

	// mixin qui permet d'appeler une méthode avec une liste de changements issue des événements "changes" de la succession des objets observés sur une propriété de this
	var WithValueChangesObservingGenerator = function(args){
		var PROP = args && args.prop || "value";
		var PROCESS_CHANGES = args && args.method || "processChanges";

		return function(){
			var oldValue;
			this.getR(PROP).flatMapLatest(function(value){
				var oldItemsRemoves = oldValue && oldValue.map && oldValue.map(function(item){
					return {value: item, type: "remove"};
				}) || [];
				var newItemsAdds = value && value.map && value.map(function(item){
					return {value: item, type: "add"};
				}) || [];
				var stream = value && value.asStream && value.asStream("changes").toProperty(oldItemsRemoves.concat(newItemsAdds)) || Bacon.constant(oldItemsRemoves);
				oldValue = value;
				return stream;
			}).onValue(function(changes){
				this[PROCESS_CHANGES](changes);
			}.bind(this));
		};
	};


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


	var ListContainer = compose(
		SimpleContainer,
		function(args){
			this._factory = args.factory;
			this._item2cmp = new Map();
		},
		{
			_valueSetter: function(value){
				this.value = value;
				// value.asStream("changes").log("changes for todos");
				// this._createComponentsFromValue(value);
				// this.set("content", this._item2cmp.values());
			},
			_valueGetter: function(){
				return this.value;
			},
			_createComponentForItem: function(item){
				var cmp = this._factory(item);
				this._item2cmp.set(item, cmp);
			},
			_destroyComponentForItem: function(item){
				var cmp = this._item2cmp.get(item);
				this._item2cmp.delete(item);
				cmp.destroy && cmp.destroy();
			},
			_createComponentsFromValue: function(items){
				var oldItems = this._item2cmp.keys();
				// remove oldItems that are no longer necessary
				oldItems.forEach(function(item){
					if (! items.has(item)){
						this._destroyComponentForItem(item);
					}
				}, this);
				// create components for new items
				items.forEach(function(item){
					if (! oldItems.has(item)){
						this._createComponentForItem(item);
					}
				}, this);
			},
			removeAllItems: function(){
				this._item2cmp.keys().forEach(this._destroyComponentForItem, this);
			},
			_processValueChanges: function(changes){
				changes.forEach(function(change){
					if (change.type === "add"){
						this._createComponentForItem(change.value);

					} else if (change.type === "remove"){
						this._destroyComponentForItem(change.value);
					}
				}, this);
				this.set("content", this._item2cmp.values());
			},
		}, {
			destroy: function(){
				this.removeAllItems();
				HtmlElement.prototype.destroy.call();
			},
		},
		// WithSetBulkObservingGenerator()
		WithValueChangesObservingGenerator({
			method: "_processValueChanges",
		})
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
			cmps.addEach({
				presenter: presenter,
			});

			cmps.factories.addEach({
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
					return new ListContainer({
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
				liveButton: function(){
					return new compose(HtmlElement, WithEmittingSubmitForHtmlButton)({tag: "button"});
				},
			});

			// bindings
			cmps.when("presenter", "todoList", function(presenter, list){
				return list.setR("value", presenter.getR("todos").onChanged());
			});
			// cmps.bindValue("presenter", "stats", "subTitle", "innerHTML");
			cmps.when("presenter", "subTitle", function(presenter, subTitle){
				return subTitle.setR("innerHTML", presenter.getR("reactive").flatMapLatest(function(reactive){
					return reactive ? presenter.getR("stats") : Bacon.never();
				}).skipDuplicates());
			});
			cmps.syncValue("presenter", "todoText", "newTodoText", "value");
			cmps.bindEvent("newTodoForm", "submit", "presenter", "addTodo");
			cmps.bindEvent("liveButton", "submit", "presenter", "toggleLive");
			cmps.bindValue("presenter", "liveButtonText", "liveButton", "innerHTML");

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
				cmps.get("liveButton"),
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