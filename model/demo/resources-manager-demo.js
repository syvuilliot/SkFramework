define([
	'intern!object',
	'intern/chai!assert',
	'collections/map',
	'collections/set',
	'ksf/utils/IndexedSet',
	'../ResourcesManager',
	'../Syncable',
	"../SerializeEachProperty",
	'frb/bind',
	'collections/listen/property-changes',
	"dojo/store/Memory",
	"compose/compose",
	"dojo/Deferred",
	"dojo/promise/all",
], function(
	registerSuite,
	assert,
	Map,
	Set,
	IndexedSet,
	Manager,
	Syncable,
	WithSerializeEachProperty,
	bind,
	propChange,
	Memory,
	compose,
	Deferred,
	waitAll
) {
	// asyncMemory
	var AsyncMemory = compose(Memory, {
		get: compose.around(function(baseGet){
			return function(id){
				var results = baseGet.call(this, id);
				var dfd = new Deferred();
				setTimeout(function(){
					dfd.resolve(results);
				}, 2000);
				return dfd;
			};
		}),
		put: compose.around(function(basePut){
			return function(item, options){
				var results = basePut.call(this, item, options);
				var dfd = new Deferred();
				setTimeout(function(){
					dfd.resolve(results);
				}, 2000);
				return dfd;
			};
		}),
	});


	// Task constructor
	function Task(label, done){
		this.label = label || "";
		this.done = done;
	}
	Object.defineProperty(Task.prototype, "label", {
		set: function(value){
			if (this.done) {
				throw "Cannot change label of a closed task";
			} else {
				this._label = value;
			}
		},
		get : function(){
			return this._label;
		},
		configurable: true,
	});
	Object.defineProperty(Task.prototype, "done", {
		set: function(value){
			this._done = !!(value);
		},
		get : function(){
			return this._done;
		},
		configurable: true,
	});
	Task.prototype.toggle = function(){
		this.done = !(this.done);
	};

	// Person Constructor
	function Person(fullName){
		this.fullName = fullName || "prenom nom";
	}
	Object.defineProperty(Person.prototype, "fullName", {
		get: function(){
			return this.firstName + " " + this.lastName;
		},
		// just for fun
		set: function(value){
			if (!(value && value.split)) return;
			var names = value.split(" ");
			this.firstName = names[0];
			this.lastName = names[1];
		},
		configurable: true,
	});




	var WithSerializeOneProperty = function(args){
		var propName = args.property;
		this.serialize = function(rsc){
			var propMng = this.propertyManagers[propName];
			return propMng.serialize(this.getPropValue(rsc, propName));
		};
		this.deserialize = function(rsc, data){
			var propMng = this.propertyManagers[propName];
			this.setPropValue(rsc, propName, propMng.deserialize(data));
		};
	};

	var WithValidateEachProperty = function(){
		this.validate = function(rsc){
			return Object.keys(this.propertyManagers).every(function(propName){
				var propMng = this.propertyManagers[propName];
				// si une propriété n'a pas de fonction de validaiton, sa valeur est valide par défaut
				return propMng.validate ? propMng.validate(this.getPropValue(rsc, propName)) : true;
			}.bind(this));
		};
	};

	// mixin for manager of resources of type Set
	// update a property value of items added and removed from the resources (of type Set) with a property value of the resource
	var WithItemsPropertyUpdate = function(args){
		var cancelers = new Map();
		var create = this.create;
		this.create = function(){
			var rsc = create.apply(this, arguments);
			cancelers.set(rsc, rsc.addRangeChangeListener(function(added, removed){
				added = added[0]; // on a set, there is only one item
				added && (args.itemManager.setPropValue(added, args.itemProperty, this.getPropValue(rsc, args.thisProperty)));
				removed = removed[0]; // on a set, there is only one item
				removed && (args.itemManager.setPropValue(removed, args.itemProperty, undefined));
			}.bind(this)));
			return rsc;
		};
		var destroy = this.destroy;
		this.destroy = function(rsc){
			var canceler = cancelers.get(rsc);
			canceler();
			cancelers.delete(rsc);
			destroy.apply(this, arguments);
		};
	};

	// mixin for manager of resources of type Set
	// add a create method on a resource of type Set that is a shortcut to the create method of a manager
	// that cannot be done directly by the resource factory since she would have to know the specified manager (which is not recommanded)
	// TODO: prevent adding items that are not know by the specified manager ?
	var WithItemsFromResourceManager = function(args){
		var create = this.create;
		this.create = function(){
			var rsc = create.apply(this, arguments);
			rsc.create = function(createArgs){
				var item = args.manager.create(createArgs);
				rsc.add(item);
				return item;
			};
			return rsc;
		};
	};

	// Property manager that stores the values of resources
	var PropertyValueStore = function(args){
		this.store = new Map();
		// TODO: use an indexedSet for quicker getBy and allow to constraint to unique values
		// this.unique = args.unique;
	};
	PropertyValueStore.prototype = {
		install: function(rsc, arg){
			if (arguments.length === 2){
				this.set(rsc, arg);
			}
		},
		uninstall: function(rsc){
			this.store.delete(rsc);
		},
		get: function(rsc){
			return this.store.get(rsc);
		},
		set: function(rsc, value){
			this.store.set(rsc, value);
		},
		getBy: function(valueToFind){
			var findedRsc;
			this.store.some(function(value, rsc){
				if (value === valueToFind){
					findedRsc = rsc;
					return true;
				}
			});
			return findedRsc;
		},
	};

	// the value for this property is the resource directly
	// so, it is a read only property
	var PropertyValueIsResource = function(args){
	};
	PropertyValueIsResource.prototype = {
		install: function(rsc, arg){
			if (arguments.length === 2){
				this.set(rsc, arg);
			}
		},
		uninstall: function(rsc){
		},
		has: function(rsc){
			return true;
		},
		get: function(rsc){
			return rsc;
		},
		set: function(rsc, value){
		},
	};

	// The value for this property is a Set collection created at installation time
	// The property is read only : another value cannot be set after installation (but the content of the value can be changed)
	var WithValueIsSet = function(args){
		var set = this.set;
		var install = this.install;
		this.install = function(rsc, arg){
			install.apply(this, arguments);
			set.call(this, rsc, new Set());
			if (arguments.length === 2){
				this.set(rsc, arg);
			}
		};
		// the value is read only, so the set method does not change the value of the property
		// it only changes the content of the value (as an helper method)
		this.set = function(rsc, value){
			var collection = this.get(rsc);
			// TODO: remove only items that are not on rsc and add only new items
			collection.clear();
			collection.addEach(value);
		};
/*		this.add = function(rsc, item){
			var value = this.get(rsc);
			return value.add(item);
		};
		this.remove = function(rsc, item){
			var value = this.get(rsc);
			return value.delete(item);
		};
*/	};

	/**
	 * The value for this property is a ressource stored on another resources manager
	 * The value is retrieved and set at installation time and cannot be changed (but its content can still be changed)
	 * @param {object} manager The resourcesManager on which the value is retrieved
	 * @param {string} getByProperty The property name to retrieve by
	 */
	var WithValueFromManager = function (args) {
		var install = this.install;
		var set = this.set;
		this.install = function(rsc){
			install.apply(this, arguments);
			// get resource
			var value = args.manager.getBy(args.getByProperty, rsc);
			// or create it
			if (!value){
				var options = {};
				options[args.getByProperty] = rsc;
				value = args.manager.create(options);
			}
			set.call(this, rsc, value);
			// call this.set at install time to notify "observers" (WithPropertyValueBindedOnResource) of the initial value
			this.set(rsc, this.get(rsc));
		};
		this.set = function(){}; // read only
	};

	// mixin for propertyManager that does the same thing as the resourcesManager mixin "WithResourcesFromManager" but does it on every value that is set for the property, instead of doing it directly on the resource
	// is that necessary ?
	// add a create method on a value collection that is a shortcut to the create method of a manager
	// that cannot be done directly by the value since she would have to know the specified manager (which is not recommanded)
	// TODO: prevent adding items that are not know by the specified manager ?
	var PropertyManagerWithResourcesFromManager = function(args){
		var set = this.set;
		this.set = function(rsc, value){
			// remove "create" method from the current value
			var currentValue = this.get(rsc);
			if (currentValue && currentValue.create){
				delete currentValue.create;
			}
			// call original setter
			set.apply(this, arguments);
			// use getter in case the value is changed
			value = this.get(rsc);
			// add a "create" method on the new value
			value.create = function(createArgs){
				var item = args.manager.create(createArgs);
				return value.add(item);
			};
		};
	};


	// mixin for mirroring the value setted here on a property of the resource
	// and for setting a new value here when it is changed on the resource directly
	var WithPropertyValueBindedOnResource = function(args){
		var install = this.install;
		var uninstall = this.uninstall;
		var set = this.set;

		this.install = function(rsc, arg){
			install.call(this, rsc, arg);
			// store initial value of resource for this property
			this.set(rsc, rsc[args.name], true);
			// start observing value changes for this property on resource
			propChange.addOwnPropertyChangeListener(rsc, args.name, function(value){
				this.set(rsc, value, true);
			}.bind(this));
		};
		this.set = function(rsc, value, dontSyncOnRsc){
			set.call(this, rsc, value);
			value = this.get(rsc); // use getter
			if (!dontSyncOnRsc) {
				rsc[args.name] = value;
			}
		};
	};

	var WithSerialize = function(args){
		this.serialize = function(value){
			return value;
		};
		this.deserialize = function(value){
			return value;
		};
		this.serializePropName = args.serializePropName;
	};

	var WithItemsSerialize = function(args){
		this.serialize = function(list){
			return list.map(args.itemSerializer.serialize);
		};
		this.deserialize = function(list){
			return list.map(args.itemSerializer.deserialize);
		};
		this.serializePropName = args.serializePropName;
	};

	var WithRelationSerialize = function(args){
		this.serialize = function(rsc){
			return args.manager.getPropValue(rsc, "syncId");
		};
		this.deserialize = function(id){
			// ce n'est pas au manager d'être lazy, car le cas dans lequel on souhaite être lazy, c'est celui de la résolution d'id, donc on le fait ici
			var rsc = args.manager.getBy("syncId", id) || args.manager.create({
				syncId: id,
			});
			return rsc;
		};
		this.serializePropName = args.serializePropName;
		return this;
	};

	var WithStringValidate = function(args){
		this.validate = function(value){
			return (typeof value === "string") && ((args && args.length) ? value.length === args.length : true);
		};
	};



// demo data
	var taskManager;
	var personManager;
	var tasksListManager;

	var setupModel = function(){
		// taskManager
		taskManager = new Manager({
			factory: {
				create: function(){
					return new Task();
				}
			},
		});
		WithValidateEachProperty.call(taskManager);

		taskManager.propertyManagers.label = new PropertyValueStore();
		WithPropertyValueBindedOnResource.call(taskManager.propertyManagers.label, {
			name: "label",
		});
		taskManager.propertyManagers.done = new PropertyValueStore();
		WithPropertyValueBindedOnResource.call(taskManager.propertyManagers.done, {
			name: "done",
		});

		WithStringValidate.call(taskManager.propertyManagers.label);
		taskManager.propertyManagers.author = new PropertyValueStore();
		taskManager.propertyManagers.assignee = new PropertyValueStore();
		WithPropertyValueBindedOnResource.call(taskManager.propertyManagers.assignee, {
			name: "assignee",
		});

		// tasksListManager
		tasksListManager = new Manager({
			factory: {
				create: function(){
					return new Set();
				}
			},
		});

		tasksListManager.propertyManagers.tasks = new PropertyValueIsResource();
		WithValueIsSet.call(tasksListManager.propertyManagers.tasks);
		tasksListManager.propertyManagers.assignee = new PropertyValueStore();

		// personManager
		personManager = new Manager({
			factory: {
				create: function(){
					return new Person();
				},
			},
		});
		personManager.propertyManagers.fullName = new PropertyValueStore();
		WithPropertyValueBindedOnResource.call(personManager.propertyManagers.fullName, {
			name: "fullName",
		});
		personManager.propertyManagers.tasks = new PropertyValueStore();
		WithValueFromManager.call(personManager.propertyManagers.tasks, {
			manager: tasksListManager,
			getByProperty: "assignee",
		});
		WithPropertyValueBindedOnResource.call(personManager.propertyManagers.tasks, {
			name: "tasks",
		});

	};
	var setupModelWithSerialisation = function(){
		setupModel();

		// personManager
		WithSerializeEachProperty.call(personManager);
		personManager.propertyManagers.syncId = new PropertyValueStore();
		WithSerialize.call(personManager.propertyManagers.fullName, {
			serializePropName: "fullName",
		});

		// taskManager
		WithSerializeEachProperty.call(taskManager);
		WithSerialize.call(taskManager.propertyManagers.label, {
			serializePropName: "description",
		});
		taskManager.propertyManagers.syncId = new PropertyValueStore();
		WithRelationSerialize.call(taskManager.propertyManagers.assignee, {
			serializePropName: "personId",
			manager: personManager,
		});

		// tasksListManager
		WithSerializeOneProperty.call(tasksListManager, {
			property: "tasks",
		});
		WithItemsSerialize.call(tasksListManager.propertyManagers.tasks, {
			itemSerializer: WithRelationSerialize.call({}, {
				manager: taskManager,
			}),
		});
	};

	var setupModelWithSyncable = function(){
		setupModelWithSerialisation();
		// personManager
		Syncable.call(personManager);
		personManager.syncIdProperty = "syncId";
		personManager.propertyManagers.lastSourceData = new PropertyValueStore();
		personManager.propertyManagers.inSync = new PropertyValueStore();
		WithPropertyValueBindedOnResource.call(personManager.propertyManagers.inSync, {
			name: "inSync",
		});
		// taskManager
		Syncable.call(taskManager);
		taskManager.syncIdProperty = "syncId";
		taskManager.propertyManagers.lastSourceData = new PropertyValueStore();
		taskManager.propertyManagers.inSync = new PropertyValueStore();
		// tasksListManager
		Syncable.call(tasksListManager);
		tasksListManager.propertyManagers.lastSourceData = new PropertyValueStore();
		tasksListManager.propertyManagers.inSync = new PropertyValueStore();
		tasksListManager.getSyncId = function(rsc){
			return personManager.getPropValue(this.getPropValue(rsc, "assignee"), "syncId");
		};
	};

	registerSuite({
		name: "local resources management",
		"beforeEach": setupModel,
		"create resource": function(){
			var maTache = taskManager.create({});
			assert(taskManager.has(maTache));
		},
		"set and get value stored on manager": function(){
			var maTache = taskManager.create();
			taskManager.setPropValue(maTache, "author", "Sylvain");
			assert.equal(taskManager.getPropValue(maTache, "author"), "Sylvain");
		},
		"set and get value synced on resource": function(){
			var maTache = taskManager.create();
			assert.equal(maTache.done, false); // this is the default value for this business object
			assert.equal(taskManager.getPropValue(maTache, "done"), false);
			taskManager.setPropValue(maTache, "done", true);
			assert.equal(maTache.done, true);
			assert.equal(taskManager.getPropValue(maTache, "done"), true);
			maTache.done = false;
			assert.equal(taskManager.getPropValue(maTache, "done"), false);
		},
		"set and get value of a 'fromManager' property (auto populated and read-only)": function(){
			var syv = personManager.create({fullName : "Sylvain Vuilliot"});
			assert.equal(personManager.getPropValue(syv, "tasks"), tasksListManager.getBy("assignee", syv));
			assert.equal(syv.tasks, tasksListManager.getBy("assignee", syv));
			syv.tasks = "bidon";
			personManager.setPropValue(syv, "tasks", "bindon");
			assert.equal(personManager.getPropValue(syv, "tasks"), tasksListManager.getBy("assignee", syv));
			assert.equal(syv.tasks, tasksListManager.getBy("assignee", syv));
		},
		"set and get value of a 'isResource' property (read-only)": function(){
			var maListeDeTaches = tasksListManager.create({
				tasks: ["Faire les courses", "Faire le ménage"],
			});
			// maListeDeTaches.addEach(["Faire les courses", "Faire le ménage"]);
			assert.equal(tasksListManager.getPropValue(maListeDeTaches, "tasks"), maListeDeTaches);
			assert(maListeDeTaches.length === 2 && maListeDeTaches.has("Faire les courses") && maListeDeTaches.has("Faire le ménage"));
			tasksListManager.setPropValue(maListeDeTaches, "tasks", ["Faire à manger"]);
			// the value of the 'tasks' property for this resource has not been changed
			assert.equal(tasksListManager.getPropValue(maListeDeTaches, "tasks"), maListeDeTaches);
			// ... only its content has changed
			assert(maListeDeTaches.length === 1 && maListeDeTaches.has("Faire à manger"));
			assert.deepEqual(tasksListManager.getPropValue(maListeDeTaches, "tasks").toArray(), ["Faire à manger"]);
			// attention ici, on ne "set" pas une nouvelle valeur pour la propriété "tasks" mais on la modifie simplement : la valeur de "tasks" ne change pas, c'est le contenu de la valeur qui change
			maListeDeTaches.add("Réparer la porte");
			assert.deepEqual(tasksListManager.getPropValue(maListeDeTaches, "tasks").toArray(), ["Faire à manger", "Réparer la porte"]);
		},
		"validation": function(){
			var maTache = taskManager.create();
			maTache.label = "Faire le ménage";
			assert(taskManager.validate(maTache));
			maTache.label = 5;
			assert(!taskManager.validate(maTache));
		},
		"getBy": function(){
			taskManager.propertyManagers.syncId = new PropertyValueStore();
			var maTache = taskManager.create({syncId: "1"});
			assert.equal(taskManager.getBy("syncId", "1"), maTache);
		},

	});
	registerSuite({
		name: "serialize",
		beforeEach: setupModelWithSerialisation,
		"serialize person": function(){
			var syv = personManager.create();
			syv.fullName = "Sylvain Vuilliot";
			assert.deepEqual(personManager.serialize(syv), {fullName: "Sylvain Vuilliot"});
		},
		"serialize task": function(){
			var syv = personManager.create({
				syncId: "S",
				fullName: "Sylvain Vuilliot",
			});
			var maTache = taskManager.create({
				syncId: "1",
				label: "Faire les courses",
				assignee: syv,
			});
			assert.deepEqual(taskManager.serialize(maTache), {
				description: "Faire les courses",
				personId: "S",
			});
		},
		"deserialize relations": function(){
			personManager.propertyManagers.wife = new PropertyValueStore();
			WithPropertyValueBindedOnResource.call(personManager.propertyManagers.wife, {
				name: "wife",
			});
			WithRelationSerialize.call(personManager.propertyManagers.wife, {
				serializePropName: "wifeId",
				manager: personManager,
			});
			var maTache = taskManager.create();
			taskManager.deserialize(maTache, {
				description: "Faire les courses",
				personId: "S",
			});
			assert.equal(maTache.label, "Faire les courses");
			assert.equal(maTache.assignee, personManager.getBy("syncId", "S"));
			personManager.deserialize(maTache.assignee, {
				fullName: "Sylvain Vuilliot",
				wifeId: "A",
			});
			assert.equal(maTache.assignee.firstName, "Sylvain");
			assert.equal(maTache.assignee.wife, personManager.getBy("syncId", "A"));
		},
		"serialize relation with a resource without id": function(){
			// est-ce que le serializer doit faire une erreur ou bien laisser undefined ?
			var syv = personManager.create({
				fullName: "Sylvain Vuilliot",
			});
			var maTache = taskManager.create({
				syncId: "1",
				label: "Faire les courses",
				assignee: syv,
			});
			assert.deepEqual(taskManager.serialize(maTache), {
				description: "Faire les courses",
				personId: undefined,
			});
		},
		"serialize a Set of resources": function(){
			var maTache = taskManager.create({
				syncId: "1",
				label: "Faire les courses",
			});
			var monAutreTache = taskManager.create({
				syncId: "2",
				label: "Faire le ménage",
			});
			var maListeDeTaches = tasksListManager.create();
			maListeDeTaches.addEach([maTache, monAutreTache]);
			assert.deepEqual(tasksListManager.serialize(maListeDeTaches), ["1", "2"]);
		},
		"deserialize a Set of resources": function(){
			var maListeDeTaches = tasksListManager.create({
				tasks: ["Faire ci", "Faire ça"],
			});
			tasksListManager.deserialize(maListeDeTaches, ["1", "2"]);
			assert.deepEqual(maListeDeTaches.toArray(), [
				taskManager.getBy("syncId", "1"),
				taskManager.getBy("syncId", "2"),
			]);
		},
	});

	registerSuite({
		name: "syncable",
		beforeEach: setupModelWithSyncable,
		"syncStatus": function(){
			var syv = personManager.create({
				fullName: "Sylvain Vuilliot",
			});
			assert.equal(personManager.getPropValue(syv, "inSync"), false);
			personManager.setPropValue(syv, "lastSourceData", {data:{fullName: "Sylvain Vuilliot"}});
			assert.equal(personManager.getPropValue(syv, "inSync"), true);
			personManager.setPropValue(syv, "fullName", "syv");
			assert.equal(personManager.getPropValue(syv, "inSync"), false);
		},
		"observable syncStatus": function(){
			var inSyncObservedValue;
			var syv = personManager.create({
				fullName: "Sylvain Vuilliot",
			});
			assert.equal(syv.inSync, false);
			propChange.addOwnPropertyChangeListener(syv, "inSync", function(value){
				inSyncObservedValue = value;
			});
			personManager.setPropValue(syv, "lastSourceData", {data:{fullName: "Sylvain Vuilliot"}});
			assert.equal(syv.inSync, true);
			assert.equal(inSyncObservedValue, true);
			inSyncObservedValue = undefined;
			personManager.setPropValue(syv, "fullName", "syv");
			assert.equal(syv.inSync, false);
			assert.equal(inSyncObservedValue, false);
		},
	});

	registerSuite({
		name: "one to many relation for acuicité",
		beforeEach: function(){
			setupModelWithSerialisation();

			// tasksListManager
			WithItemsFromResourceManager.call(tasksListManager, {
				manager: taskManager,
			});
			WithItemsPropertyUpdate.call(tasksListManager, {
				itemManager: taskManager,
				itemProperty: "assignee",
				thisProperty: "assignee",
			});
			Syncable.call(tasksListManager);
			tasksListManager.dataSource = new AsyncMemory({data: [
				{
					id: "syv",
					tasks: [
						{label: "Faire les courses"},
						{label: "Faire le ménage"},
					],
				}
			]});
			tasksListManager.propertyManagers.lastSourceData = new PropertyValueStore();
			tasksListManager.getSyncId = function(rsc){
				return personManager.getPropValue(this.getPropValue(rsc, "assignee"), "syncId");
			};
			this.getResponse2Data = function(response){
				return response.tasks;
			};
			this.putResponse2Id = function(response){
				return response.id;
			};
			this.putResponse2Data = function(response){
			};
			tasksListManager.push = function(rsc){
			};
		},
		"person with tasks": function(){
			var syv = personManager.create({
				fullName: "Sylvain Vuilliot",
			});
			assert(tasksListManager.getPropValue(syv.tasks, "assignee"), syv);
			var courses = taskManager.create({
				label: "Faire les courses",
			});
			syv.tasks.add(courses);
			assert(syv.tasks.has(courses));
			assert.equal(courses.assignee, syv);
			syv.tasks.delete(courses);
			assert.equal(courses.assignee, undefined);
		},
		"create tasks via tasksList": function(){
			var syv = personManager.create({
				fullName: "Sylvain Vuilliot",
			});
			var task = syv.tasks.create({
				label: "Faire le ménage",
			});
			assert.equal(task.label, "Faire le ménage");
			assert.equal(task.assignee, syv);
			assert.equal(syv.tasks.length, 1);
			assert(syv.tasks.has(task));
		},
		"pull remote data": function(){
			var syv = personManager.create({syncId: "syv"});
			return syv.tasks.pull().then(function(){
				assert.equal(syv.tasks.length, 2);
				syv.tasks.forEach(function(task){
					assert(task.label === "Faire les courses" || task.label === "Faire le ménage");
					assert.equal(task.assignee, syv);
				});
			});
		},
	});

});