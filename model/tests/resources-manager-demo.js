define([
	'intern!object',
	'intern/chai!assert',
	'../../utils/IndexedSet',
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
	Registry,
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
					var manager = tmp.personsManager;
					var rsc = new Person(data && data.fullName);
					if (data && data.id) rsc.id = data.id;
					// add methods
					rsc._commit = function(){
						return manager.commit(rsc);
					};
					rsc.pull = function(){
						return manager.pull(rsc);
					};
					rsc.push = function(){
						return manager.push(rsc);
					};
					rsc.revert = function(){
						return manager.merge(rsc);
					};
					// auto commit : observe properties changes to react to
					propChange.addOwnPropertyChangeListener(rsc, "firstName", rsc._commit.bind(rsc));
					propChange.addOwnPropertyChangeListener(rsc, "lastName", rsc._commit.bind(rsc));
					// bind syncStatus
					bind(rsc, "syncStatus", {
						"<-": "_syncStatus.get($)",
						source: manager,
						parameters: rsc,
					});
					return rsc;
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
			deserialize: function(person, data){
				person.fullName = data.fullName;
			},
			compare: function(appState, sourceState){
				// in case of difference, we consider that appState should be saved
				if (appState.fullName === sourceState.fullName) {
					return 1;
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

	}

	var tmp;
	registerSuite({
		"beforeEach": function(){
			tmp = {};
			setup(tmp);
		},
		"creation and registering": function () {
			var syv = tmp.personsManager.get("1");
			assert(tmp.personsManager.has(syv));
		},
		"serialisation": function(){
			var syv = tmp.personsManager.get("1");
			assert(tmp.personsManager.serialize(syv).fullName === "prenom nom");
		},
		"saving in dataSource": function(){
			var syv = tmp.personsManager.get("1");
			syv.firstName = "titi";
			syv.lastName = "Cobaye";
			return syv.push().then(function(){
				assert(tmp.personsDataSource.data[0].fullName === "titi Cobaye");
				console.log(tmp.personsDataSource.data[0].fullName); // to be sure that async assertion is well executed
			});
		},
		"pulling from dataSource": function(){
			var syv = tmp.personsManager.get("1");
			var pullRequest = tmp.personsManager.pull(syv);
			var reqStatus = tmp.personsManager.getRequestStatus(syv);
			assert(reqStatus.stage === "inProgress");
			return pullRequest.then(function(){
				assert(reqStatus.stage === "success");
				assert(syv.firstName === "Sylvain");
				console.log(syv);
			});
		},
		"reverting to server state": function () {
			var syv = tmp.personsManager.get("1");
			return syv.pull().then(function(){
				assert.equal(syv.syncStatus, "inSync");
				syv.firstName = "titi";
				assert.equal(syv.syncStatus, "toSave");
				syv.revert();
				assert.equal(syv.firstName, "Sylvain");
				assert.equal(syv.syncStatus, "inSync");
			});
		},
		"unregistering": function(){
			var toto = tmp.personsManager.get("1");
			var personsManager = tmp.personsManager;
			personsManager.remove(toto);
			assert(personsManager.has(toto) === false);
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