define([
	'intern!object',
	'intern/chai!assert',
	'ksf/utils/IndexedSet',
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

	var ConnectedResourcesManager = compose(
		Registry,
		_WithFactory,
		_Connected,
		_Syncable
	);
	_WithFactory.applyPrototype.call(ConnectedResourcesManager.prototype);

	function setup(tmp){

		//sites dataSource
		tmp.sitesDataSource = new AsyncMemory({
			data: [{
				id: "1",
				description: "Site #1",
				status: "5",
			}, {
				id: "2",
				description: "Site #2",
				status: "3",
			}, {
				id: "3",
				description: "Site #3",
				status: "1",
			}]
		});

		tmp.siteManager = new ConnectedResourcesManager({
			factory: {
				create: function(id){
					return {id: id};
				},
				update: function(site, data){
					site.id = data.id;
					site.description = data.description;
					site.status = tmp.statusManager.get(data.status);
				},
				destroy: function(id, site){
					tmp.statusManager.release(site.status);
				},
			},
			dataSource: tmp.sitesDataSource,
			keyProperty: "id",
			serialize: function(site){
				return {
					id: site.id,
					description: site.description,
					status: site.status.id,
				};
			},
			compare: function(appState, sourceState){
				// in case of difference, we consider that appState should be saved
				if (appState !== sourceState) {
					return +1;
				} else {
					return 0;
				}
			},
			fetchResponse2data: function(resp){
				return resp;
			},
			pushResponse2id: function(resp){
				return resp; // the memory store only returns the id
			},
			pushResponse2data: function(resp){
				return null; // we do not get data in push response
			},
		});

		// non connected resourceManager
		tmp.statusManager = new Registry({
			keyProperty: "id",
		});
		_WithFactory.applyPrototype.call(tmp.statusManager);
		_WithFactory.call(tmp.statusManager, {
			factory: {
				create: function(id){
					return {id: id};
				},
				update: function(status, data){
					status.id = data.id;
					status.label = data.label;
				},
				destroy: function(site){}, //nothing to do
			},
		});

		//sites dataSource
		tmp.statusListsDataSource = new AsyncMemory({
			data: [{
				id: "all",
				data: [{
					id: "1", label: "Status #1",
				}, {
					id: "2", label: "Status #2",
				}, {
					id: "4", label: "Status #4",
				}, {
					id: "5", label: "Status #5",
				}],
			}]
		});

		tmp.statusListManager = new ConnectedResourcesManager({
			factory: {
				create: function(){
					return [];
				},
				update: function(statusList, data){
					data.forEach(function(serializedStatus, i){
						var status = tmp.statusManager.get(serializedStatus.id);
						if (statusList[i] !== status){ // s'il n'y a pas de changement, on ne fait rien
							tmp.statusManager.release(statusList[i]); // on déclare ne plus utiliser l'ancien
							statusList[i] = status;
						}
						tmp.statusManager.factory.update(status, serializedStatus);
					});
					// supprimer les statuts en trop s'il y en a
					var delta = statusList.length - data.length;
					if (delta > 0) {
						for (var i = 0; i++; i< delta){
							statusList.pop();
						}
					}
					return statusList;
				},
				destroy: function(id, statusList){
					statusList.forEach(function(status){
						tmp.statusManager.release(status);
					});
				},

			},
			dataSource: tmp.statusListsDataSource,
			keyProperty: "id",
			serialize: function(site){
				return JSON.stringify(site);
			},
			compare: function(appState, sourceState){
				// in case of difference, we consider that appState should be saved
				if (appState !== sourceState) {
					return +1;
				} else {
					return 0;
				}
			},
			fetchResponse2data: function(resp){
				return resp.data;
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
		"get initial data from server": function () {
			var site1 = tmp.siteManager.get("1");
			assert.equal(site1.id, "1");
			assert.equal(site1.status, undefined);

			var requestStatus = tmp.siteManager.getRequestStatus(site1);
			assert.equal(requestStatus.stage, undefined);

			var request = tmp.siteManager.pull(site1);
			assert(requestStatus.stage === "inProgress");

			return request.then(function(){
				assert(requestStatus.stage === "success");
				assert.equal(site1.id, "1");
				var status5 = site1.status;
				assert.equal(status5.id, "5");
				assert.equal(status5.label, undefined);
				var allStatus = tmp.statusListManager.get("all");
				return tmp.statusListManager.pull(allStatus).then(function(){
					assert.equal(site1.status, status5);
					assert.equal(status5.label, "Status #5");
				});
			});

		},
	});


});