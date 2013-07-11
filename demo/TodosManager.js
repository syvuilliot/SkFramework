define([
	"compose/compose",
	"SkFramework/utils/IndexedSet",
	"SkFramework/component/_RegistryWithFactory",
	"SkFramework/component/MultiFactories",
	'SkFramework/component/BindingFactory',
	'collections/map',
	'collections/set',
	'SkFramework/utils/Evented',
	'bacon.js/Bacon',

	"collections/shim-array",
	"collections/listen/array-changes",
], function(
	compose,
	IndexedSet,
	_RegistryWithFactory,
	MultiFactories,
	BindingFactory,
	Map,
	Set,
	Evented,
	Bacon
){
	var Destroyable = function(){
		this._owned = [];
	};
	Destroyable.prototype = {
		own: function(o){
			this._owned.push(o);
			return o;
		},
		unown: function(o){
			this._owned.delete(o);
		},
		destroy: function(){
			this._owned.forEach(function(o){
				if (typeof o === "function"){
					o();
				} else {
					o.destroy && o.destroy();
				}
				this.unown(o);
			}.bind(this));
		},
	};

	var WithGetSet = function(){
		this._changing = 0;
	};
	WithGetSet.prototype = {
		remove: function(prop){
			this._startChanging();
			if (this["_"+prop+"Remover"]){
				this["_"+prop+"Remover"](prop);
			} else {
				this["_Remover"](prop); // default
			}
			this._stopChanging();
		},
		get: function(prop){
			if (this["_"+prop+"Getter"]){
				return this["_"+prop+"Getter"](prop);
			} else {
				return this["_Getter"](prop); // default getter
			}
		},
		getEach: function(){
			return Array.prototype.map.call(arguments, function(prop){
				return this.get(prop);
			}, this);
		},
		set: function(prop, settedValue){
			this._startChanging();
			if (this["_"+prop+"Setter"]){
				this["_"+prop+"Setter"](settedValue);
			} else {
				this["_Setter"](prop, settedValue); // default setter
			}
			this._stopChanging();
		},
		has: function(prop){
			if (this["_"+prop+"Detector"]){
				return this["_"+prop+"Detector"](prop);
			} else {
				return this["_Detector"](prop); // default detector
			}
		},
		setEach: function(values){
			this._startChanging();
			Object.keys(values).forEach(function(key){
				this.set(key, values[key]);
			}, this);
			this._stopChanging();
		},
		_startChanging: function(){
			this._changing ++;
		},
		_stopChanging: function(){
			this._changing --;
			if (this._changing === 0){
				this._emit("changed");
			}
		},

	};
	var WithDefaultGetterSetter = {
		_Getter: function(prop){
			return this[prop];
		},
		_Setter: function(prop, value){
			this[prop] = value;
		},
		_Detector: function(prop){
			return this.hasOwnProperty(prop);
		},
		_Remover: function(prop){
			delete this[prop];
		},
	};
	var WithGetRSetRBacon = function(){
	};
	WithGetRSetRBacon.prototype = {
		// create an eventStream from an eventType
		asStream: function(eventType){
			var emitter = this;
			var streams = this._streams || (this._streams = {});
			return streams[eventType] || (streams[eventType] = new Bacon.EventStream(function(subscriber) {
				var handler = emitter.on(eventType, function(event){
					subscriber(new Bacon.Next(function() {
						return event;
					}));
				});
				return function() {
					handler.destroy();
				};
			}));
		},
		asReactive: function(){
			return this._reactive || (this._reactive = this.asStream("changed").map(this).toProperty(this));
		},
		// return a bacon reactive from expression applied to this
		watch: function(expression, equals){
			return this.asReactive().map(expression).skipDuplicates(equals);
		},
		// return a bacon reactive with the value of the property
		getR: function(prop){
			var reactive = this.asReactive().map(".get", prop).skipDuplicates();
			var args = Array.prototype.slice.call(arguments, 1);
			args.forEach(function(prop){
				reactive = reactive.flatMapLatest(function(value){
					return value && value.getR && value.getR(prop) || Bacon.constant(undefined);
				});
			});

			return reactive;
			// faut-il ne mettre une valeur initiale que lorsque la propriété est installée ou mimer le résultat d'un get normal qui renvoi undefined même si la propriété n'est pas installée ? Dans le cas du indexedSet, c'est pratique de ne pas utiliser la méthode "has" car elle sert à tester la présence d'une valeur et pas d'une propriété...
/*			if (this.has(prop)){
				return stream.toProperty(this.get(prop));
			} else {
				return stream.toProperty();
			}
*/
		},
		getEachR: function(){
			// implementation qui utilise getR
			var streams = Array.prototype.map.call(arguments, function(prop){
				if (Array.isArray(prop)){
					return this.getR.apply(this, prop);
				}
				return this.getR(prop);
			}, this);
			return Bacon.combineAsArray(streams)/*.sampledBy(this.asStream("changed")).skipDuplicates()*/;
			// sampledBy permet de n'émettre la valeur que sur l'événement "changed" de l'objet et pas sur chaque output des getR
			// mais par contre, cela revient à émettre aussi lorsqu'aucun getR n'a émit, d'où le skipDuplicates qui permet de détecter que la valeur n'a pas changé (un nouveau array n'a pas été créé)

			// implementation qui n'utilise pas getR
/*			var props = arguments;
			return this.asStream("changed").map(function(){
				return this.getEach.apply(this, props);
			}.bind(this)).toProperty(this.getEach.apply(this, arguments));
*/		},
		// call set(prop) with value from observable at each notification
		setR: function(prop, observable){
			return observable.onValue(this, "set", prop);
		},
		// create a bidi value binding from this to target
		bind: function(targetProp, mode, source, sourceProp){
			var init = true;
			var target = this;
			var sourceValueR = source.getR(sourceProp);
			var targetValueR = target.getR(targetProp);
			var changing = false;
			var sourceHandler = sourceValueR.onValue(function(value){
				if (! changing){
					changing = true;
					target.set(targetProp, value);
					changing = false;
				}
			});
			var targetHandler = targetValueR.onValue(function(value){
				if (! changing && ! init){ // prevent calling source.set at init time
					changing = true;
					source.set(sourceProp, value);
					changing = false;
				}
			});
			init = false;
			return this.own(function(){
				targetHandler();
				sourceHandler();
			});
		},

		// permet d'éxécuter une fonction lorsque la valeur de chaque propriété est définie (!== undefined) et à chaque fois que la valeur de l'une ou plusieurs d'entre elles change
		// afin de faciliter les choses, si la fonction retourne un canceler ou destroyable, celui-ci est exécutée/détruit à la prochaine itération (changement de l'une ou plusieurs des propriétés et même si une des valeurs est undefined)
		//
		when: function(){
			var canceler;
			var args = Array.prototype.slice.call(arguments, 0, arguments.length-1).map(function(cmp){
				return this.getR(cmp);
			}.bind(this));
			var binder = arguments[arguments.length-1];

			args.push(function(){
				// console.log("cb called");
				if (canceler){
					if (canceler.destroy) {
						canceler.destroy();
					} else {
						canceler();
					}
					this.unown && this.unown(canceler);
					canceler = undefined;
				}
				if (Array.prototype.every.call(arguments, function(val){
					return val !== undefined;
				})) {
					canceler = binder.apply(this, arguments);
					this.own && this.own(canceler);
				}
			}.bind(this));
			return this.own(Bacon.onValues.apply(Bacon, args));
		},
		bindValue: function(source, sourceProp, target, targetProp){
			return this.when(source, target, function(source, target){
				return target.setR(targetProp, source.getR(sourceProp));
			});
		},
		syncValue: function(source, sourceProp, target, targetProp){
			return this.when(source, target, function(source, target){
				var init = true;
				var sourceValueR = source.getR(sourceProp);
				var targetValueR = target.getR(targetProp);
				var changing = false;
				var sourceHandler = sourceValueR.onValue(function(value){
					if (! changing){
						changing = true;
						target.set(targetProp, value);
						changing = false;
					}
				});
				var targetHandler = targetValueR.onValue(function(value){
					if (! changing && ! init){
						changing = true;
						source.set(sourceProp, value);
						changing = false;
					}
				});
				init = false;
				return function(){
					targetHandler();
					sourceHandler();
				};
			});
		},
		bindEvent: function(source, eventType, target, targetMethod){
			return this.when(source, target, function(source, target){
				return source.on(eventType, function(ev){
					target[targetMethod](ev);
				});
			});
		},
	};

	var ObservableObject = compose(
		compose,
		WithGetSet,
		Evented,
		WithDefaultGetterSetter,
		WithGetRSetRBacon
	);


	var WithDefaultGetterSetterForHtmlElement = function(){
		this._Getter = function(prop){
			return this.domNode[prop];
		};
		this._Setter = function(prop, value){
			this.domNode[prop] = value;
		};
		this._Detector = function(prop){
			return this.domNode.hasOwnProperty(prop);
		};
		this._Remover = function(prop){
			// delete this[prop]; // we can't do this on an HtmlElement, that breaks it
		};
		this._domNodeGetter = function(){
			return this.domNode;
		};
	};

	var WithChildrenForHtmlElement = function(args){
		this.children = [];
	};
	WithChildrenForHtmlElement.prototype = {
		addChild: function(child){
			this.children.add(child);
			this.domNode.appendChild(child.get("domNode"));
		},
		removeChild: function(child){
			this.domNode.removeChild(child.get("domNode"));
			this.children.delete(child);
		},
		// TODO: appeler addChild et removeChild en minimsant les modif
		_childrenSetter: function(children){
			this.children.forEach(this.removeChild, this);
			children.forEach(this.addChild, this);
		},
		_childrenGetter: function(){
			return this.children;
		},
	};

	var HtmlElement = compose(
		ObservableObject,
		Destroyable,
		WithDefaultGetterSetterForHtmlElement,
		WithChildrenForHtmlElement,
		function(args){
			this.domNode = document.createElement(args.tag);
			if (args) {
				this.setEach(args);
			}
		}
	);

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


	// je considère que le fait d'ajouter un "fallback" qui appelle une factory quand un composant n'est pas trouvé par "get" n'est pas une fonctionnalité en soit, c'est juste une logique de surcharge. Donc, suivant ce que l'on s'est dit, je le met directement dans la "composition" et je n'en fait pas un mixin à part (comme c'était le cas).
	var LazyRegistry = compose(
		IndexedSet,
		WithGetRSetRBacon,
		Destroyable,

		function(args){
			this._usersCount = new Map();
			this.factories = new Map();
		},
		{
			get: function(id){
				var cmp = IndexedSet.prototype.get.call(this, id);
				if (!cmp) {
					var factory = this.factories.get(id);
					cmp = factory && factory();
					cmp && this.add(cmp, id);
				}
				if (cmp) {
					this._usersCount.set(cmp, (this._usersCount.get(cmp) || 0) + 1);
				}
				return cmp;
			},
			release: function(cmp) {
				var count = (this._usersCount.get(cmp) || 0) - 1;
				if (count <= 0){
					this._usersCount.delete(cmp);
					this.remove(cmp);
					cmp.destroy && cmp.destroy();
				} else {
					this._usersCount.set(cmp, count);
				}
			},
		}
	);

	var WithComponentsRegistryGenerator = function(args){
		var REGISTRY_NAME = args && args.registryName || "_components";

		var WithComponentsRegistry = function(args){
			this[REGISTRY_NAME] = new LazyRegistry();
		};
		WithComponentsRegistry.prototype = {
			destroy: function(){
				this[REGISTRY_NAME].forEach(function(cmp){
					cmp.destroy();
				});
			},
		};
		return WithComponentsRegistry;

	};
	var WithComponentsRegistry = WithComponentsRegistryGenerator();
	WithComponentsRegistry.create = WithComponentsRegistryGenerator;


	// c'est un domComponent dont la création du domNode est délégué à d'autres domComponents
	// on peut ainsi se contenter de manipuler les composants selon l'API KSF au lieu de manipuler directement des domNodes
	// c'est pourquoi il a l'outillage pour manipuler des composants : componentsRegsitry et layoutManager
	var CompositeDomComponent = compose(
		ObservableObject,
		Destroyable, // WithBindingsRegistry
		WithComponentsRegistry, // no need for customization
		// WithTreeLayoutManager
		{
			destroy: function(){
				Destroyable.prototype.destroy.call(this);
				WithComponentsRegistry.prototype.destroy.call(this);
			},
		}
	);

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

	var ReactiveSet = compose(
		Set,
		Evented,
		WithGetRSetRBacon,
		function(){
			this.addRangeChangeListener(function(){
				this._emit("changed");
			});
		}, {
			watchDiff: function(args){
				return this.asReactive().map(".clone", 1).diff(new Set(), function(oldSet, newSet){
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

	var WithTodosForPresenter = function(args){
		var remainingTodo = function(todo){
			return !todo.get("done");
		};

		this.setR("remainingCount", this.getR("todos")
			.flatMapLatest(function(todos){
				return todos && todos.asReactive() || Bacon.constant(undefined);
			})
			// on each change of "todos" create a new stream that observes all current todos
			.flatMapLatest(function(todos){
				return todos && Bacon.combineAsArray(todos.map(function(todo){
					return todo.asReactive();
				})) || Bacon.never();
			})
			.map(".filter", remainingTodo)
			.map(".length")
			.skipDuplicates()
			.log("remainingCount")
		);

		this.setR("stats", this.getR("remainingCount").combine(this.getR("todos")
				.flatMapLatest(function(todos){
					return todos && todos.asReactive().map(".length") || Bacon.constant(undefined);
				})
				.skipDuplicates(),
			function(remaining, total){
				return remaining + " remaining todos out of " + total;
			}
		));

		var assignee = window.assignee = new ObservableObject({name: "Sylvain"});
		var todo = window.todo = new Todo({text:'faire les courses', done:false, assignee: assignee});
		// this.getEachR("todoText", "price", ["todo", "assignee", "name"]).log("getEach");

		this.setEach({
			"todoText": "",
			"qty": 2,
			"price": 10,
			"todo": todo,
		});

		// demo data
		this.set("todos", new ReactiveSet([
			new Todo({text:'learn angular', done:true}),
			new Todo({text:'build an angular app', done:false}),
		]));

		// this.getR("todo", "assignee", "name").log("todo.assignee.name:");

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
		addTodo: function() {
			var todo = new Todo({text:this.get("todoText")});
			console.log("todo created", todo);
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
	};

	// mixin qui permet d'observer une valeur de type Set de façon unitaire (item par item)
	// pour le cas où l'on voudrait modifier les noms de méthodes
	var WithSetObservingGenerator = function(args){
		var PROP = "value";
		var ADD_ITEM = "addItem";
		var REMOVE_ITEM = "removeItem";
		var REMOVE_ALL_ITEMS = "removeAllItems";

		return function(){
			this.when(PROP, function(value){
				this[REMOVE_ALL_ITEMS]();
				return value.watchDiff().onValue(function(diff){
					diff.removed.forEach(this[REMOVE_ITEM], this);
					diff.added.forEach(this[ADD_ITEM], this);
				}.bind(this));
			});
		};
	};

	// on pourrait imaginer un autre mixin qui lui fait de l'observation en masse
	var WithSetBulkObservingGenerator = function(args){
		var PROP = "value";
		var SWAP = "swap";
		var REMOVE_ALL_ITEMS = "removeAllItems";

		return function(){
			this.when(PROP, function(value){
				this[REMOVE_ALL_ITEMS]();
				return value.watchDiff().onValue(function(diff){
					this[SWAP](diff.removed, diff.added);
				}.bind(this));
			});
		};
	};

	var List = compose(
		HtmlElement,
		WithSetObservingGenerator(),
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
			addItem: function(item){
				var cmp = this.factory(item);
				this._item2cmp.set(item, cmp);
				this.addChild(cmp);
			},
			removeItem: function(item){
				var cmp = this._item2cmp.get(item);
				this.removeChild(cmp);
				this._item2cmp.delete(item);
				cmp.destroy && cmp.destroy();
			},
			removeAllItems: function(){
				this._item2cmp.forEach(this.removeItem, this);
			},
		}, {
			destroy: function(){
				this.removeAllItems();
				HtmlElement.prototype.destroy.call();
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
					return new HtmlElement({tag: "div"});
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
							var container = new HtmlElement({tag: "li"});
							var textDisplayer = new compose(HtmlElement, WithEmittingChangedForHtmlElement)({tag: "input"});
							var doneEditor = new compose(HtmlElement, WithEmittingChangedForHtmlElement)({tag: "input", type: "checkbox"});
							var deleteButton = new compose(HtmlElement, WithEmittingSubmitForHtmlButton)({tag: "button", innerHTML: "X"});
							// la question est de savoir comment les enregistrer dans le registre du todoManager... ou faut-il le déléguer à "list" ?
							cmps.addEach([container, textDisplayer, doneEditor, deleteButton]);
							container.set("children", [doneEditor, textDisplayer, deleteButton]);

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
					return new compose(HtmlElement, WithEmittingSubmitForHtmlForm)({tag: "form"}); // new Form(); // TODO: create a Form component
				},
				newTodoText: function(){
					return new compose(HtmlElement, WithEmittingChangedForHtmlElement)({tag: "input", placeHolder: "add new todo"});
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
/*			this._layout.addConfig("default", {
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
			this._layout.applyConfig("default");
*/			// manual layout to be removed
			this.domNode = this._components.get("root").domNode;
			this._components.get("root").addChild(this._components.get("title"));
			this._components.get("root").addChild(this._components.get("subTitle"));
			this._components.get("root").addChild(this._components.get("todoList"));
			this._components.get("root").addChild(this._components.get("newTodoForm"));
			this._components.get("newTodoForm").addChild(this._components.get("newTodoText"));
			this._components.get("newTodoForm").addChild(this._components.get("addTodoButton"));


		}
	);


	return TodosManager;
});