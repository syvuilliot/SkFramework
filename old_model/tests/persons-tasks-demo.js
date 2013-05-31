define([
	'intern!object',
	'intern/chai!assert',
	"collections/map",
	'frb/bind',
	"dojo/store/Memory",
	"compose/compose",
	"dojo/Deferred",
	"dojo/promise/all",
], function(
	registerSuite,
	assert,
	Map,
	bind,
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
		query: compose.around(function(baseQuery){
			return function(queryParams){
				// console.log("query called", arguments);
				var results = baseQuery.call(this, queryParams);
				var dfd = new Deferred();
				setTimeout(function(){
					dfd.resolve(results);
				}, 2000);
				return dfd;
			};
		}),
	});

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

	// Task constructor
	function Task(label, done, assignee){
		this.label = label || "";
		this.done = done || false;
		this.assignee = assignee;
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



	//persons remote dataStore
	var personsRemoteDataStore = new AsyncMemory({
		data: [{
			id: "1",
			fullName: "Sylvain Vuilliot",
			child: true,
		}, {
			id: "2",
			fullName: "Quentin Vuilliot",
			child: true,
		}, {
			id: "3",
			fullName: "Yves Vuilliot",
			child: false,
		}],
	});

	//persons local dataStore
	var personsLocalDataStore = new Memory();


	var GetDataSource = function(store){
		this._store = store;
	};
	GetDataSource.prototype = {
		get: function(arg){
			return this._store.get(arg);
		},
		put: function(data, options){
			return this._store.put(data, options);
		},
	};

	var QueryDataSource = function(store){
		this._store = store;
	};
	QueryDataSource.prototype = {
		get: function(arg){
			return this._store.query(arg);
		},
		put: function(data, options){
			return this._store.put(data, options);
		},
	};

	var personsLocalDataSource = new GetDataSource(personsLocalDataStore);
	var personsListsLocalDataSource = new QueryDataSource(personsLocalDataStore);
	var personsRemoteDataSource = new GetDataSource(personsRemoteDataStore);
	var personsListsRemoteDataSource = new QueryDataSource(personsRemoteDataStore);

	// exemple d'une resource synchronisable avec un serveur et persistable localement
	var PersonResource = function(args){
		this._remoteSource = args.remoteSource; // sync source
		this._remoteId = args.remoteId;
		// this._localSource = args.localSource; // backup source
		// this._localId = args.localId;
	};
	PersonResource.prototype = {
		// return a new object with current state of the resource
		getState: function(){
			return {
				firstName: this.firstName,
				lastName: this.lastName,
			};
		},
		// change state of the resource
		setState: function(state){
			// store last state
			this._lastState = this.getState();
			this._lastStateTime = this.lastChangeTime;
			// update public properties
			this.lastChangeTime = new Date();
			this._exposeState(state);
			// update sync status
			this._updateSyncStatus();

		},
		// expose the data in a way that is handy for views
		_exposeState: function(state){
			this.firstName = state.firstName;
			this.lastName = state.lastName;
		},
		_setRemoteState: function(state){
			this._remoteState = state;
			this.remoteStateTime = new Date();
			// update sync status
			this._updateSyncStatus();
		},
		// refresh remote data source cache
		fetch: function(){
			return this._remoteSource.get(this._remoteId).then(function(resp){
				this._setRemoteState(this._fetchResponse2data(resp));
			}.bind(this));
		},
		push: function(){
			var state = this.getState();
			var id = this._remoteId;
			return this._remoteSource.put(state, (id ? {id: id}: undefined)).then(function(id){
				this._remoteId = id; // should only be used at creation
				this._setRemoteState(state); // le memoryStore ne renvoie pas les données mais idéalement, il faudrait utiliser les données renvoyées par le serveur ou refaire un fetch pour être sûr d'être synchro avec le serveur
				// ici on prend le raccourci de dire que puisque la requête de mise à jour est successfull, on doit être synchro
			}.bind(this));
		},
		_updateSyncStatus: function(){
			var local = this.getState();
			var remote = this._remoteState;

			if (! local && ! remote) {
				return this.syncStatus = undefined;
			}
			if (local && ! remote){
				return this.syncStatus = "toSave"; // new local resource
			}
			if (remote && ! local){
				return this.syncStatus = "toMerge"; // fetched resource not merged
			}
			// here we use a time comparison but it should be "revision", or other flags
			if (this._statesAreEqual(local, remote)){
				this.lastInSyncTime = new Date();
				return this.syncStatus = "inSync"; // states are in sync (we don't care about the time stamps)
			} else {
				if (this.lastChangeTime > this.lastInSyncTime && this.remoteStateTime > this.lastInSyncTime){
					return this.syncStatus = "conflict"; // the local state and the remote state have changed differently
				} else  if (this.lastChangeTime > this.lastInSyncTime) {
					return this.syncStatus = "toSave"; // only the local state has changed
				} else {
					return this.syncStatus = "toMerge"; // only the remote state has changed
				}
			}
		},
		_statesAreEqual: function(local, remote){
			return local.firstName === remote.firstName && local.lastName === remote.lastName;
		},
		merge: function(){
			// here the merge logic is only to override local state with remote state
			// but we could try to do a merge by property
			this.setState(this._remoteState);
		},
		_fetchResponse2data: function(resp){
			var names = resp.fullName.split(" ");
			return {
				firstName: names[0],
				lastName: names[1],
			};
		},
		_pushResponse2id: function(resp){
			return resp; // the memory store return only the id
		},
		_pushResponse2data: function(resp){
			return null; // we do not get data in push response
		},

		// je me demande si cela ne doit pas être fait par imbrication, plutôt qu'à plat
		// une instance de PersonResource deviendrait alors le "state" d'une instance de LocalPersonResource qui ferait pull et push avec une base de données locale
/*		backup: function(){
			var data = JSON.stringify(this); // we save all data of resource not only its state
			var id = this._localSource.put(this, {id: this._localId});
			this._localId = id;
		},
		restore: function(){
			// we don't use setXXX methods, we only restore a snapshot of the resource
			var data = this._localSource.get(this._localId);
			Object.keys(data).forEach(function(prop){
				this[prop] = data[prop];
			}.bind(this));
		},
*/	};

	var PersonsListResource = function(args){
		PersonResource.apply(this, arguments);
	};
	PersonsListResource.prototype = Object.create(PersonResource.prototype);
	PersonsListResource.prototype._exposeState = function(array){
		this.persons =  array.map(function(id){
			return personManager.get(id); // convert id to a resource that is easier to consume by a view
		});
	};
	PersonsListResource.prototype.getState = function(){
		return this.persons && this.persons.map(function(person){
			return person._remoteId; // revert person back to an id
		});
	};
	PersonsListResource.prototype._statesAreEqual = function(local, remote){
		var sortedLocal = local.sorted();
		var sortedRemote = remote.sorted();
		return sortedLocal.some(function(personId, index){
			return personId === sortedRemote[index];
		});
	};
	PersonsListResource.prototype._fetchResponse2data = function(resp){
		return resp.map(function(person){
			return person.id;
		});
	};

	var personManager = {
		// localDataSource: personsLocalDataSource,
		remoteDataSource: personsRemoteDataSource,
		resources: new Map(),
		get: function(id){
			var rsc;
			if (this.resources.has(id)){
				rsc = this.resources.get(id);
			} else {
				rsc = this._create(id);
				this.resources.set(id, rsc);
			}
			return rsc;
		},
		_create: function(id){
			return new PersonResource({
				remoteSource: this.remoteDataSource,
				remoteId: id,
			});
		},
	};

	var personsListManager = {
		remoteDataSource: personsListsRemoteDataSource,
		resources: new Map(null, function hash(value){
			return JSON.stringify(value);
		}),
		get: function(params){
			var rsc;
			if (this.resources.has(params)){
				rsc = this.resources.get(params);
			} else {
				rsc = this._create(params);
				this.resources.set(params, rsc);
			}
			return rsc;
		},
		_create: function(params){
			return new PersonsListResource({
				remoteSource: this.remoteDataSource,
				remoteId: params,
			});
		},
	};




	registerSuite({
/*		"map with hash function": function(){
			var map = new Map(null, null, function hash(value){
				return JSON.stringify(value);
			});
			var query = {child: false};
			var rsc = {};
			map.set(query, rsc);
			assert(map.has({child: false}));
			assert.equal(map.get({child: false}), rsc);
		},
		"create new resource": function(){
			var syv = window.syv = personManager.get("syv");
			var state = {
				firstName: "Syv",
				lastName: "Vuilliot",
			};
			syv.setState(state);
			assert.deepEqual(syv.getState(), state);
			assert.equal(syv.firstName, state.firstName);

			assert.equal(syv.syncStatus, "toSave");

			return syv.push().then(function(){
				assert.equal(syv.syncStatus, "inSync");
			});
		},
		"get remote resource by id": function(){
			var syv = window.syv = personManager.get("1");
			assert.equal(syv.syncStatus, undefined);
			return syv.fetch().then(function(){
				assert.equal(syv.syncStatus, "toMerge");
				syv.merge();
				assert.equal(syv.syncStatus, "inSync");
				assert.equal(syv.firstName, "Sylvain");
			});
		},
*/		"get remote resource of type list by id": function(){
			var children = window.children = personsListManager.get({child: true});
			assert.equal(children.syncStatus, undefined);
			return children.fetch().then(function(){
				assert.equal(children.syncStatus, "toMerge");
				children.merge();
				assert.equal(children.syncStatus, "inSync");
				var syv = children.persons[0];
				assert.equal(syv, personManager.get("1")); // syv is unique
				return syv.fetch().then(function(){
					syv.merge();
					assert.equal(syv.syncStatus, "inSync");
					assert.equal(syv.firstName, "Sylvain");
					console.log(children.persons[0].firstName);
				});
			});
		},
	});

	var PersonEditor = new DomComponent();
	var firstPersonEditor = new PersonEditor({
		value:
	})


});