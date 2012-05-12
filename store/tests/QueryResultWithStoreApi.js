﻿define([
	"doh/runner",
	"dojo/store/Memory",
], function(doh, Memory){

	window.mainMemoryStore = new Memory({
		data: [
			{id:"1", name:"toto1", job:"farmer", country:"France"},
			{id:"2", name:"toto2", job:"farmer", country:"Italy"},
			{id:"3", name:"toto3", job:"farmer", country:"France"},
			{id:"4", name:"toto4", job:"pilote", country:"France"},
			{id:"5", name:"toto5", job:"pilote", country:"France"},
		]
	});

	window.farmers = mainMemoryStore.query({job: "farmer"});
	
	
	doh.register("Query result with store API",{
		"total": function(t){
			t.is(3, farmers.total);
		},
		"forEach": function(t){
			farmers.forEach(function(item){
				t.t(item);
			});
		},
		"get": function(t){
			t.is("toto2", farmers.get("2").name);
			t.f(farmers.get("4"), "can only get items that are in queryResult");
		},
		"put": function(t){
			farmers.put({id:"6", name:"toto6", job:"farmer", country:"GB"});
			t.is("farmer", mainMemoryStore.get("6"));
		},
		"query": function(t){
			var frenchFarmers = farmers.query({country: "France"});
			t.is(2, frenchFarmers.total);
		},
		"remove": function(t){
			farmers.remove("2");
			t.is(2, farmers.total);
		},
	});
});