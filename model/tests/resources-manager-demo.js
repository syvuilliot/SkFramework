define([
	'intern!object',
	'intern/chai!assert',
	'../../utils/IndexedSet',
	'ksf/component/_RegistryWithFactory',
	'../_Versioning',
	'../_Connected',
	'../_Syncable',
	'frb/bind',
	"dojo/store/Memory",
	"compose/compose",
	"dojo/Deferred",
	"dojo/promise/all",
], function(
	registerSuite,
	assert,
	Registry,
	_WithFactory,
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
		Registry,
		_WithFactory,
		_Versioning,
		_Connected,
		_Syncable
	);
	_WithFactory.applyPrototype.call(Manager.prototype);

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
			factory: {
				create: function(data){
					var rsc = new Person(data && data.fullName);
					if (data && data.id) rsc.id = data.id;
					return rsc;
				},
				update: function(person, data){
					person.fullName = data.fullName;
				},
				destroy: function(person){}, //nothing to do
			},
			dataSource: tmp.personsDataSource,
			keyProperty: "id",
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

		tmp.toto = tmp.personsManager.get("1");
		tmp.personsManager.factory.update(tmp.toto, {
			fullName: "Toto Cobaye"
		});

	}

	var tmp;
	registerSuite({
		"beforeEach": function(){
			tmp = {};
			setup(tmp);
		},
		"creation and registering": function () {
			assert(tmp.personsManager.has(tmp.toto));
		},
		"serialisation": function(){
			assert(tmp.personsManager.getState(tmp.toto).fullName === "Toto Cobaye");
		},
		"reverting": function () {
			tmp.personsManager.storeState(tmp.toto);
			tmp.toto.firstName = "titi";
			tmp.personsManager.restoreState(tmp.toto, 0);
			assert(tmp.personsManager.getState(tmp.toto).fullName === "Toto Cobaye");
		},
		"saving in dataSource": function(){
			tmp.toto.firstName = "titi";
			return tmp.personsManager.push(tmp.toto).then(function(){
				assert(tmp.personsDataSource.data[0].fullName === "titi Cobaye");
				console.log(tmp.personsDataSource.data[0].fullName); // to be sure that async assertion is well executed
			});
		},
		"pulling from dataSource": function(){
			var pullRequest = tmp.personsManager.pull(tmp.toto);
			var reqStatus = tmp.personsManager.getRequestStatus(tmp.toto);
			assert(reqStatus.stage === "inProgress");
			return pullRequest.then(function(){
				assert(reqStatus.stage === "success");
				assert(tmp.toto.firstName === "Sylvain");
				console.log(tmp.toto);
			});
		},
		"unregistering": function(){
			var toto = tmp.toto;
			var personsManager = tmp.personsManager;
			personsManager.remove(toto);
			assert(personsManager.has(toto) === false);
			assert(personsManager.getStoredState(toto) === undefined);
			assert(personsManager.getRequestStatus(toto) === undefined);
		},
		"request status update in concurent requests": function(){
			var personsManager = tmp.personsManager;
			var syv = personsManager.get("1");
			var status = personsManager.getRequestStatus(syv);
			var req1 = personsManager.fetch(syv);
			assert.equal(status.request, req1);
			var startDate1 = status.started;
			var req2 = personsManager.fetch(syv);
			assert.equal(status.request, req2);
			var startDate2 = status.started;
			assert.notEqual(startDate1, startDate2);
			req1.then(function(){
				assert.equal(status.stage, "inProgress"); // the status is not updated on req1 success since another request has been fired since
			});
			return req2.then(function(){
				assert.equal(status.stage, "success");
			});

		},
		"active requests": function(){
			var personsManager = tmp.personsManager;
			var syv = personsManager.get("1");
			var activeRequests = personsManager.getActiveRequests(syv);
			var req1 = personsManager.fetch(syv);
			assert.equal(activeRequests.length, 1);
			assert.equal(activeRequests[0].request, req1);
			var req2 = personsManager.fetch(syv);
			assert.equal(activeRequests.length, 2);
			assert.equal(activeRequests[1].request, req2);
			req1.then(function(){
				assert.equal(activeRequests.length, 1);
				assert.equal(activeRequests[0].request, req2);
				console.log("req1 successfull");
			});
			return req2.then(function(){
				assert.equal(activeRequests.length, 0);
			});
		}
	});


});