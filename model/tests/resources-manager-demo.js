define([
	'SkFramework/utils/wru-amd',
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
	wru,
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

	var Manager = compose(
		ResourcesManager,
		_Factory,
		_IdMapping,
		_Versioning,
		_Connected,
		_Syncable
	);

	function setup(tmp){

		//persons dataSource
		tmp.personsDataSource = new AsyncMemory({
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



		tmp.personsManager = new Manager({
			createResource: function(data){
				var rsc = new Person(data && data.fullName);
				if (data && data.id) rsc.id = data.id;
				return rsc;
			},
			updateResource: function(person, data){
				person.fullName = data.fullName;
			},
			destroyResource: function(person){}, //nothing to do
			dataSource: tmp.personsDataSource,
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

		tmp.toto = tmp.personsManager.create({
			fullName: "Toto Cobaye"
		});

	}

	wru.test([
		{
			name: "creation and registering",
			test: function (tmp) {
				wru.assert(tmp.personsManager.has(tmp.toto));
			},
			setup: setup,
		},
		{
			name: "serialisation",
			setup: setup,
			test: function(tmp){
				wru.assert(tmp.personsManager.getState(tmp.toto).fullName === "Toto Cobaye");
			},
		},
		{
			name: "reverting",
			setup: setup,
			test: function (tmp) {
				tmp.personsManager.storeState(tmp.toto);
				tmp.toto.firstName = "titi";
				tmp.personsManager.restoreState(tmp.toto, 0);
				wru.assert(tmp.personsManager.getState(tmp.toto).fullName === "Toto Cobaye");
			},
		},
		{
			name: "saving in dataSource",
			setup: setup,
			test: function(tmp){
				tmp.toto.firstName = "titi";
				tmp.personsManager.push(tmp.toto).then(wru.async(function(){
					wru.assert(tmp.personsDataSource.data[3].fullName === "titi Cobaye");
				}));
			},
		},
		{
			name: "pulling from dataSource",
			setup: setup,
			test: function(tmp){
				tmp.personsManager.setId(tmp.toto, "1");
				var reqStatus;
				tmp.personsManager.pull(tmp.toto).then(wru.async(function(){
					wru.assert(reqStatus.stage === "success");
					wru.assert(tmp.toto.firstName === "Sylvain");
					wru.log(tmp.toto);
				}));
				reqStatus = tmp.personsManager.getRequestStatus(tmp.toto);
				wru.assert(reqStatus.stage === "inProgress");
			},
		},
		{
			name: "unregistering",
			setup: setup,
			test: function(tmp){
				var toto = tmp.toto;
				var personsManager = tmp.personsManager;
				personsManager.unregister(toto);
				wru.assert(personsManager.has(toto) === false);
				wru.assert(personsManager.getStoredState(toto) === undefined);
				wru.assert(personsManager.getRequestStatus(toto) === undefined);
			},
		},
	]);


});