define([
	"doh/runner",
	"../../utils/identical",
	"../Memory",
	"dojo/_base/declare",
	"dojo/_base/lang",
], function(doh, identical, Memory, declare, lang){

	//test data set
	var toto = {id:"1", name: "toto", birthYear:1990};	
	var titi = {id:"2", name: "titi", job: "coder", birthYear:1980};
	var tata = {id:"3", name: "tata", birthYear: 1980};

	doh.i = doh.identical = function(expected, actual, sortArrays, hint){
		if (! identical(expected, actual, sortArrays)){
			throw new doh._AssertFailure("assertEqual() failed:\n\texpected\n\t\t"+JSON.stringify(expected)+"\n\tbut got\n\t\t"+JSON.stringify(actual)+"\n\n", hint);
		}
		return true;
	};


	doh.register("PersistableMemory store test", {
		"load initial data": function(t){
			window.store = new Memory({data:[toto, titi]});
			//console.log(store);
			t.i([toto, titi], store.slice(), true);
		},
		"put": function(t){
			window.store = new Memory({data:[toto, titi]});
			store.put(tata);
			//console.log(store);
			t.i([toto, titi, tata], store.slice(), true);
		},
		"chained queries": function(t){
			window.store = new Memory({data:[toto, titi, tata]});
			window.subStore = store.query({birthYear:1980});
			//console.log(subStore);
			t.i([titi, tata], subStore.slice(), true);
			window.subSubStore = subStore.query({job:"coder"});
			//console.log(subSubStore);
			t.i([titi], subSubStore.slice(), true);
		},
		"get": function(t){
			window.store = new Memory({data:[toto, titi]});
			t.i(toto, store.get("1"));
		},
		"remove": function(t){
			window.store = new Memory({data:[toto, titi, tata]});
			store.remove("2");
			t.i([toto, tata], store.slice(), true);
		},
		"forEach": function(t){
			window.store = new Memory({data:[toto, titi, tata]});
			var result = [];
			store.forEach(function(item){
				result.push(item);
			});
			t.i([toto, titi, tata], result, true);
		},
	});

});