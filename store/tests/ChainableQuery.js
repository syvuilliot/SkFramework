﻿define([
	"doh/runner",
	"dojo/_base/lang",
	"dojo/store/Memory",
	"dojo/store/Observable",
	'../ChainableQuery',
	"../../utils/identical"
], function(doh, lang, Memory, Observable, SubQueryable, identical){
	doh.i = doh.identical = function(expected, actual, sortArrays, hint){
		if (! identical(expected, actual, sortArrays)){
			throw new doh._AssertFailure("assertEqual() failed:\n\texpected\n\t\t"+JSON.stringify(expected)+"\n\tbut got\n\t\t"+JSON.stringify(actual)+"\n\n", hint);
		}
		return true;
	};
	
	window.toto1 = {id:"1", name:"toto1", job:"farmer", country:"France", age:20};
	window.toto2 = {id:"2", name:"toto2", job:"farmer", country:"Italy", age:30};
	window.toto3 = {id:"3", name:"toto3", job:"farmer", country:"France", age:30};
	window.toto4 = {id:"4", name:"toto4", job:"pilote", country:"France", age:30};
	window.toto5 = {id:"5", name:"toto5", job:"pilote", country:"France"};
	window.toto6 = {id:"6", name:"toto6", job:"farmer", country:"GB"};
	window.toto7 = {id:"7", name:"toto7", job:"farmer", country:"France", age:30};
	window.toto8 = {id:"8", name:"toto8", job:"pilote", country:"GB"};

	var testSet = {
		// "total": function(t){
		// 	t.is(3, farmers.total);
		// },
		"forEach (farmers)": function(t){
			var qr = [];
			farmers.forEach(function(item){
				qr.push(item);
			});
			t.i([toto1, toto2, toto3], qr, true);
		},
		"forEach (pilotes)": function(t){
			var qr = [];
			pilotes.forEach(function(item){
				qr.push(item);
			});
			t.i([toto4, toto5], qr, true);
		},
		"query.forEach (frenchFarmers)": function(t){
			var qr = [];
			frenchFarmers.forEach(function(item){
				qr.push(item);
			});
			t.i([toto1, toto3], qr, true);
		},
		"store.query.query.query (frenchFarmersThirty)": function(t){
			var qr = [];
			frenchFarmersThirty.forEach(function(item){
				qr.push(item);
			});
			t.i([toto3], qr, true);
		},
		"get": function(t){
			t.is(toto2, farmers.get("2"));
			/* not implemented yet
			t.f(farmers.get("4"), "can only get items that are in queryResult");
			*/
		},
		"put": function(t){
			farmers.put(toto6);
			t.i(toto6, farmers.get("6"));
			farmers.remove("6");
			//actually we can add items that do not match the query
			// farmers.put(toto8);
			// t.is("error: you cannot put an object that do not match the query", farmers.get("8").job);
		},
		"remove": function(t){
			farmers.remove("2");
			t.f(farmers.get("2"));
			t.f(store.get("2"));
		},
	};

	doh.register("Store with queryResult API", testSet, function setUp(){
		window.memoryStore = new Memory({
			data: [
				toto1,
				toto2,
				toto3,
				toto4,
				toto5,
			]
		});
		window.store = SubQueryable(memoryStore);

		window.farmers = store.query({job: "farmer"});
		window.pilotes = store.query({job: "pilote"});
		window.frenchFarmers = farmers.query({country: "France"});
		window.frenchFarmersThirty = frenchFarmers.query({age: 30});
	});


	doh.register("Observable subqueryable store non regression tests", testSet, function setUp(){
		window.memoryStore = new Memory({
			data: [
				toto1,
				toto2,
				toto3,
				toto4,
				toto5,
			]
		});
		window.store = SubQueryable(Observable(memoryStore));

		window.farmers = store.query({job: "farmer"});
		window.pilotes = store.query({job: "pilote"});
		window.frenchFarmers = farmers.query({country: "France"});
	});

	var ObservationTestSet = {
		"farmersChanges": function(t){
			t.i([{item: toto7}, {item: toto6}], farmersChanges, true);
		},
		"frenchFarmersChanges": function(t){
			t.i([{item: toto7}], frenchFarmersChanges, true);
		},
		"frenchFarmersThrityChanges": function(t){
			t.i([{item: toto7}], frenchFarmersThirtyChanges, true);
		},
		"farmers list update": function(t){
			var farmersList = [];
			farmers.forEach(function(item){
				farmersList.push(item);
			});
			t.i([toto1, toto2, toto3, toto6, toto7], farmersList, true);
		},
		"french farmers list update": function(t){
			var frenchFarmersList = [];
			frenchFarmers.forEach(function(item){
				frenchFarmersList.push(item);
			});
			t.i([toto1, toto3, toto7], frenchFarmersList, true);
		},
		"french farmers thirty list update": function(t){
			var frenchFarmersThirtyList = [];
			frenchFarmersThirty.forEach(function(item){
				frenchFarmersThirtyList.push(item);
			});
			t.i([toto3, toto7], frenchFarmersThirtyList, true);
		},
		"pilotes list update": function(t){

			//be sure that pilotes are not affected
			t.i([], pilotesChanges, true);
			pilotesList = [];
			pilotes.forEach(function(item){
				pilotesList.push(item);
			});
			t.i([toto4, toto5], pilotesList, true);

		},
	};
	doh.register("Observable subqueryable store observation tests", ObservationTestSet, function setUp(){
		window.memoryStore = new Memory({
			data: [
				toto1,
				toto2,
				toto3,
				toto4,
				toto5,
			]
		});
		window.store = SubQueryable(Observable(memoryStore));
		window.farmers = store.query({job: "farmer"});
		window.frenchFarmers = farmers.query({country: "France"});
		window.frenchFarmersThirty = frenchFarmers.query({age: 30});
		window.pilotes = store.query({job: "pilote"});

		window.farmersChanges=[];
		window.farmersObserveHandler = farmers.observe(function(item, from, to){
			farmersChanges.push({
				item: item,
				// from: from,
				// to: to
			});
		}, true);
		window.frenchFarmersChanges=[];
		window.frenchFarmersObserveHandler = frenchFarmers.observe(function(item, from, to){
			frenchFarmersChanges.push({
				item: item,
				// from: from,
				// to: to
			});
		}, true);
		window.frenchFarmersThirtyChanges=[];
		window.frenchFarmersThirtyObserveHandler = frenchFarmersThirty.observe(function(item, from, to){
			frenchFarmersThirtyChanges.push({
				item: item,
				// from: from,
				// to: to
			});
		}, true);
		window.pilotesChanges=[];
		window.pilotesObserveHandler = pilotes.observe(function(item, from, to){
			pilotesChanges.push({
				item: item,
				// from: from,
				// to: to
			});
		}, true);

		store.put(toto7);
		store.put(toto6);

	});
});