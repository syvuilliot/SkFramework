define([
	"doh/runner",
	"dojo/store/Memory",
	'../SubQueryable',
	"SkFramework/utils/identical",
], function(doh, Memory, SubQueryable, identical){
	doh.i = doh.identical = function(expected, actual, sortArrays, hint){
		if (! identical(expected, actual, sortArrays)){
			throw new doh._AssertFailure("assertEqual() failed:\n\texpected\n\t\t"+JSON.stringify(expected)+"\n\tbut got\n\t\t"+JSON.stringify(actual)+"\n\n", hint);
		}
		return true;
	};
	
	window.toto1 = {id:"1", name:"toto1", job:"farmer", country:"France"};
	window.toto2 = {id:"2", name:"toto2", job:"farmer", country:"Italy"};
	window.toto3 = {id:"3", name:"toto3", job:"farmer", country:"France"};
	window.toto4 = {id:"4", name:"toto4", job:"pilote", country:"France"};
	window.toto5 = {id:"5", name:"toto5", job:"pilote", country:"France"};
	
	
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
	
	doh.register("Store with queryResult API",{
		"total": function(t){
			t.is(3, farmers.total);
		},
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
		"get": function(t){
			t.is(toto2, farmers.get("2"));
			/* not implemented yet
			t.f(farmers.get("4"), "can only get items that are in queryResult");
			*/
		},
		"put": function(t){
			farmers.put({id:"6", name:"toto6", job:"farmer", country:"GB"});
			t.is("farmer", memoryStore.get("6").job);
			memoryStore.remove("6");
			//actually we can add items that do not match the query
			farmers.put({id:"7", name:"toto7", job:"pilote", country:"GB"});
			t.is("pilote", memoryStore.get("7").job);
			memoryStore.remove("7");
		},
		"remove": function(t){
			farmers.remove("2");
			t.f(farmers.get("2"));
			t.f(store.get("2"));
			t.f(memoryStore.get("2"));
		},
	});
});