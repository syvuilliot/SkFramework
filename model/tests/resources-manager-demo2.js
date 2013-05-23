define([
	'intern!object',
	'intern/chai!assert',
	'collections/map',
	'collections/set',
	'ksf/utils/IndexedSet',
	'ksf/component/_RegistryWithFactory',
	'../_Versioning',
	'../_Connected',
	'../_Syncable',
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
	_WithFactory,
	_Versioning,
	_Connected,
	_Syncable,
	bind,
	propChange,
	Memory,
	compose,
	Deferred,
	waitAll
) {
	// Task constructor
	function Task(label, done){
		this.label = label || "";
		this.done = done || false;
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
			var names = value.split(" ");
			this.firstName = names[0];
			this.lastName = names[1];
		}
	});

	var Manager = function(args){
		this.resources = new Set();
		this.propertyManagers = {};
		this._factory = args.factory;
	};
	Manager.prototype = {
		create: function(args){
			// create instance
			var rsc = this._factory.create(args);
			// add properties
			Object.keys(this.propertyManagers).forEach(function(propName){
				var propMng = this.propertyManagers[propName];
				propMng.install(rsc);
				// set the property value if it is defined
				if (args && args[propName]){
					propMng.set(rsc, args[propName]);
				}
			}.bind(this));
			// register resource
			this.add(rsc);
			return rsc;
		},
		destroy: function(rsc){
			this.remove(rsc);
			Object.keys(this.propertyManagers).forEach(function(propName){
				var propMng = this.propertyManagers[propName];
				propMng.uninstall(rsc);
			}.bind(this));
			rsc.destroy && rsc.destroy();
		},
		add: function(rsc){
			return this.resources.add(rsc);
		},
		remove: function(rsc){
			return this.resources.delete(rsc);
		},
		has: function(rsc){
			return this.resources.has(rsc);
		},
		getPropValue: function(rsc, propName){
			return this.propertyManagers[propName].get(rsc);
		},
		setPropValue: function(rsc, propName, value){
			return this.propertyManagers[propName].set(rsc, value);
		},
	};

/*	var SetManager = function(args){
		this.resources = new Set();
		this.itemsManager = args.itemsManager;
		this._factory = args.factory;
	};
	SetManager.prototype = {
		create: function(args){
			// create instance
			var rsc = this._factory.create(args);
			// register resource
			this.add(rsc);
			return rsc;
		},
		destroy: function(rsc){
			this.remove(rsc);
			rsc.destroy && rsc.destroy();
		},
		add: function(rsc){
			return this.resources.add(rsc);
		},
		remove: function(rsc){
			return this.resources.delete(rsc);
		},
		has: function(rsc){
			return this.resources.has(rsc);
		},
	};
*/


	// new Syncable that stores the syncId has a simple resource property
	var Syncable = function(args){
		this.dataSource = args.dataSource;
		this.propertyManagers.syncId = new PropertyValueOnManager({
			name: "syncId",
			manager: this,
		});
		var create = this.create;
		this.create = function(args){
			var mng = this;
			var rsc = create.call(this, args);
			// args.syncId && this.setPropValue(rsc, "syncId", args.syncId);
			rsc.fetch = function(){
				return mng.fetch(rsc);
			};
			return rsc;
		};
		// since the values of maps are not indexed we need to iterate over each value
		this.getBySyncId = function(id){
			var rsc;
			this.syncId.some(function(value, key){
				if (value === id){
					rsc = key;
					return true;
				}
			});
			return rsc;
		};

		this.propertyManagers.lastSourceData = new PropertyValueOnManager({
			name: "lastSourceData",
			manager: this,
		});
		this.fetch = function(rsc){
			return this.dataSource.get(this.getPropValue(rsc, "syncId")).then(function(response){
				var data = this.getResponse2Data(response);
				this.setPropValue(rsc, "lastSourceData", {
					time: new Date(),
					data: data,
				});
			}.bind(this));
		};
		this.merge = function(rsc, options){
			this.deserialize(rsc, this.getPropValue(rsc, "lastSourceData"), options);
		};
		this.push = function(rsc, options){
			var data = this.serialize(rsc);
			var id = this.getPropValue(rsc, "syncId");
			if (id) options.id = id;
			return this.dataSource.put(data, options).then(function(response){
				var id = this.putResponse2Id(response);
				var data = this.putResponse2Data(response);
				id && this.setPropValue(rsc, "syncId", id);
				data && this.setPropValue(rsc, "lastSourceData", data);
			});
		};
		this.getResponse2Data = function(response){
			return response;
		};

	};
	// delègue la sérialisation à chaque manager de propriété
	// la "sérialisation" consiste à extraire les données d'une resource dans le but de les exporter vers une source de données
	// la désérialisation consiste à mettre à jour la resource à partir d'un objet de données
	// dans le cas des relations, c'est l'occasion de transformer les objets en une référence (un id)
	// les méthodes pourraient se nommer "getData(rsc)->data" et "setData(rsc, data)"
	var WithSerializeEachProperty = function(){
		this.serialize = function(rsc){
			var data = {};
			Object.keys(this.propertyManagers).forEach(function(propName){
				var propMng = this.propertyManagers[propName];
				if (propMng.serialize){
					data[propMng.serializePropName] = propMng.serialize(this.getPropValue(rsc, propName));
				}
			}.bind(this));
			return data;
		};
		this.deserialize = function(rsc, data, options){
			// TODO: on pourrait prévoir dans les options (comme dans backbone) de permettre de supprimer les propriétés qui ne sont pas dans data, ou au contraire d'ajouter celles qui sont en plus, ou d'empêcher la mise à jour de certaines
			// ici, on ne fait qu'écraser les valeurs de toutes les propriétés qui ont une méthode "deserialize"
			Object.keys(this.propertyManagers).forEach(function(propName){
				var propMng = this.propertyManagers[propName];
				if (propMng.deserialize){
					this.setPropValue(rsc, propName, propMng.deserialize(data[propMng.serializePropName]));
				}
			}.bind(this));
		};
	};

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

	// the value for this property is stored on a property of the resource (which is an object)
	var PropertyValueOnResourceProperty = function(args){
		this.propName = args.name;
	};
	PropertyValueOnResourceProperty.prototype = {
		install: function(rsc){
			// in this case, the install is not necessary, it is done at set time
			// rsc[this.propName] = undefined;
		},
		uninstall: function(rsc){
			delete rsc[this.propName];
		},
		has: function(rsc){
			return rsc.hasOwnProperty(this.propName);
		},
		get: function(rsc){
			return rsc[this.propName];
		},
		set: function(rsc, value){
			rsc[this.propName] = value;
		},
	};
	// the value for this property is stored on a Map on the manager
	var PropertyValueOnManager = function(args){
		this.propName = args.name;
		this.manager = args.manager;
		this.manager[this.propName] = new Map();
	};
	PropertyValueOnManager.prototype = {
		install: function(rsc){
			this.manager[this.propName].set(rsc);
		},
		uninstall: function(rsc){
			this.manager[this.propName].delete(rsc);
		},
		get: function(rsc){
			return this.manager[this.propName].get(rsc);
		},
		set: function(rsc, value){
			return this.manager[this.propName].set(rsc, value);
		},
	};
	// the value for this property is stored on the resource directly which has the Set interface (add and remove)
	var PropertyValueOnSetResource = function(args){
	};
	PropertyValueOnSetResource.prototype = {
		install: function(rsc){
		},
		uninstall: function(rsc){
		},
		has: function(rsc){
			return true;
		},
		get: function(rsc){
			return rsc.toArray();
		},
		set: function(rsc, value){
			rsc.clear();
			rsc.addEach(value);
		},
		addItem: function(rsc, item){
			rsc.add(item);
		},
		removeItem: function(rsc, item){
			rsc.delete(item);
		},
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
			var rsc = args.manager.getBySyncId(id) || args.manager.create({
				syncId: id,
			});
			return rsc;
		};
		this.serializePropName = args.serializePropName;
		return this;
	};

	var WithStringValidate = function(){
		this.validate = function(value){
			return (typeof value === "string");
		};
	};

	var taskManager;
	var personManager;
	var tasksListManager;

	registerSuite({
		"beforeEach": function(){
			// taskManager
			taskManager = new Manager({
				factory: {
					create: function(){
						return new Task();
					}
				},
			});
			WithSerializeEachProperty.call(taskManager);
			WithValidateEachProperty.call(taskManager);

			taskManager.propertyManagers.label = new PropertyValueOnResourceProperty({
				name: "label",
			});
			taskManager.propertyManagers.author = new PropertyValueOnManager({
				name: "author",
				manager: taskManager,
			});
			WithSerialize.call(taskManager.propertyManagers.label, {
				serializePropName: "description",
			});
			WithStringValidate.call(taskManager.propertyManagers.label);

			// tasksListManager
			tasksListManager = new Manager({
				factory: {
					create: function(){
						return new Set();
					}
				},
			});
			WithSerializeOneProperty.call(tasksListManager, {
				property: "tasks",
			});

			tasksListManager.propertyManagers.tasks = new PropertyValueOnSetResource();
			WithItemsSerialize.call(tasksListManager.propertyManagers.tasks, {
				itemSerializer: WithRelationSerialize.call({}, {
					manager: taskManager,
				}),
			});

			// personManager
			personManager = new Manager({
				factory: {
					create: function(){
						return new Person();
					},
				},
			});
			WithSerializeEachProperty.call(personManager);
			personManager.propertyManagers.fullName = new PropertyValueOnResourceProperty({
				name: "fullName",
			});
			WithSerialize.call(personManager.propertyManagers.fullName, {
				serializePropName: "fullName",
			});
		},
		"create resource": function(){
			var maTache = taskManager.create({});
			assert(taskManager.has(maTache));
		},
		"set and get value stored on resource": function(){
			var maTache = taskManager.create();
			taskManager.setPropValue(maTache, "label", "Faire les courses");
			assert.equal(maTache.label, "Faire les courses");
			assert.equal(taskManager.getPropValue(maTache, "label"), "Faire les courses");
			maTache.label = "Faire le ménage";
			assert.equal(taskManager.getPropValue(maTache, "label"), "Faire le ménage");
		},
		"set and get value stored on manager": function(){
			var maTache = taskManager.create();
			taskManager.setPropValue(maTache, "author", "Sylvain");
			assert.equal(taskManager.getPropValue(maTache, "author"), "Sylvain");
		},
		"serialize": function(){
			var maTache = taskManager.create();
			maTache.label = "Faire le ménage";
			assert.deepEqual(taskManager.serialize(maTache), {description: "Faire le ménage"});
			// console.log(taskManager.serialize(maTache));
		},
		"serialize person": function(){
			var syv = personManager.create();
			syv.firstName = "Sylvain";
			assert.deepEqual(personManager.serialize(syv), {fullName: "Sylvain nom"});
		},
		"validation": function(){
			var maTache = taskManager.create();
			maTache.label = "Faire le ménage";
			assert(taskManager.validate(maTache));
			maTache.label = 5;
			assert(!taskManager.validate(maTache));
		},
		"create resource with syncId": function(){
			Syncable.call(taskManager, {});
			var maTache = taskManager.create({syncId: "1"});
			// taskManager.setPropValue(maTache, "syncId", "1");
			assert.equal(taskManager.getBySyncId("1"), maTache);
		},
		"serialize relation": function(){
			Syncable.call(taskManager, {});
			Syncable.call(personManager, {});
			taskManager.propertyManagers.assignee = new PropertyValueOnResourceProperty({
				name: "assignee",
			});
			WithRelationSerialize.call(taskManager.propertyManagers.assignee, {
				serializePropName: "personId",
				manager: personManager,
			});
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
		"deserialize relation": function(){
			Syncable.call(taskManager, {});
			Syncable.call(personManager, {});
			taskManager.propertyManagers.assignee = new PropertyValueOnResourceProperty({
				name: "assignee",
			});
			WithRelationSerialize.call(taskManager.propertyManagers.assignee, {
				serializePropName: "personId",
				manager: personManager,
			});
			personManager.propertyManagers.wife = new PropertyValueOnResourceProperty({
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
			assert.equal(maTache.assignee, personManager.getBySyncId("S"));
			personManager.deserialize(maTache.assignee, {
				fullName: "Sylvain Vuilliot",
				wifeId: "A",
			});
			assert.equal(maTache.assignee.firstName, "Sylvain");
			assert.equal(maTache.assignee.wife, personManager.getBySyncId("A"));
		},
		"serialize relation with a resource without id": function(){
			// est-ce que le serializer doit faire une erreur ou bien doit-il lancer lui-même la synchro de la resource ?
		},
		"set and get value stored on a resource of type Set": function(){
			var maListeDeTaches = tasksListManager.create({
				tasks: ["Faire les courses", "Faire le ménage"],
			});
			assert(maListeDeTaches.has("Faire les courses") && maListeDeTaches.has("Faire le ménage"));
			tasksListManager.setPropValue(maListeDeTaches, "tasks", ["Faire à manger"]);
			assert(maListeDeTaches.has("Faire à manger"));
			assert.deepEqual(tasksListManager.getPropValue(maListeDeTaches, "tasks"), ["Faire à manger"]);
			maListeDeTaches.add("Réparer la porte");
			assert.deepEqual(tasksListManager.getPropValue(maListeDeTaches, "tasks"), ["Faire à manger", "Réparer la porte"]);
		},
		"serialize a Set of resources": function(){
			Syncable.call(taskManager, {});
			Syncable.call(tasksListManager, {});
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
			Syncable.call(taskManager, {});
			Syncable.call(tasksListManager, {});
			var maListeDeTaches = tasksListManager.create({
				tasks: ["Faire ci", "Faire ça"],
			});
			tasksListManager.deserialize(maListeDeTaches, ["1", "2"]);
			assert.deepEqual(maListeDeTaches.toArray(), [
				taskManager.getBySyncId("1"),
				taskManager.getBySyncId("2"),
			]);
		},
	});

});