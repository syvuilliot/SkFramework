define([
	'../ResourcesManager',
	'../_Factory',
	'../_IdMapping',
	'../_Versioning',
	'../_Connected',
	'../_Syncable',
	'frb/bind',
	"dojo/store/Memory",
	"compose/compose",
	"dojo/Deferred",
	"dojo/promise/all",
], function(
	ResourcesManager,
	_Factory,
	_IdMapping,
	_Versioning,
	_Connected,
	_Syncable,
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

	//persons dataSource
	personsDataSource = new AsyncMemory({
		data: [{
			id: "1",
			fullName: "Sylvain Vuilliot",
		}, {
			id: "2",
			fullName: "Quentin Vuilliot",
		}, {
			id: "3",
			fullName: "Yves Vuilliot",
		}]
	});


	var Manager = compose(
		ResourcesManager,
		_Factory,
		_IdMapping,
		_Versioning,
		_Connected,
		_Syncable
	);

	personsManager = new Manager({
		createResource: function(data){
			var rsc = new Person(data && data.fullName);
			if (data && data.id) rsc.id = data.id;
			return rsc;
		},
		updateResource: function(person, data){
			person.fullName = data.fullName;
		},
		destroyResource: function(person){}, //nothing to do
		dataSource: personsDataSource,
		idProperty: "id",
		serialize: function(person){
			var state = {};
			state.fullName = person.fullName;
			if (person.id) state.id = person.id;
			return state;
		},
		compare: function(appState, sourceState){
			// in case of difference, we consider that appState should be saved
			if (appState.fullName !== sourceState.fullName) {
				return +1;
			} else {
				return 0;
			}
		},
		fetchResponse2data: function(resp){
			return resp;
		},
		pushResponse2id: function(resp){
			return resp; // the memory store return only the id
		},
		pushResponse2data: function(resp){
			return null; // we do not get data in push response
		},

	});

	console.log("Start of tests");

	// creation and registering
	toto=personsManager.create({
		fullName: "Toto Cobaye"
	});
	console.assert(personsManager.has(toto));
	// serialisation
	console.assert(personsManager.getState(toto).fullName === "Toto Cobaye");
	personsManager.storeState(toto);
	// reverting
	toto.firstName = "titi";
	personsManager.restoreState(toto, 0);
	console.assert(personsManager.getState(toto).fullName === "Toto Cobaye");
	// saving in dataSource
	toto.firstName = "titi";
	personsManager.push(toto).then(function(){
		console.assert(personsDataSource.data[3].fullName === "titi Cobaye");
		console.log("saving ok");
	});
	// pulling from dataSource
	p1 = personsManager.create();
	personsManager.setId(p1, "1");
	var promise = personsManager.pull(p1);
	var reqStatus = personsManager.getRequestStatus(p1);
	console.assert(reqStatus.stage === "inProgress");
	promise.then(function(){
		console.assert(reqStatus.stage === "success");
		p1.firstName = "Sylvain";
		console.log("pulling ok");
	});
	// unregistering
	personsManager.unregister(toto);
	console.assert(personsManager.has(toto) === false);
	console.assert(personsManager.getStoredState(toto) === undefined);
	console.assert(personsManager.getRequestStatus(toto) === undefined);

	console.log("End of tests");



});