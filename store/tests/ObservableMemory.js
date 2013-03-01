define([
	"doh/runner",
	"../../utils/identical",
	"../Memory",
	"dojo/store/Observable",
	"dojo/_base/declare",
	"dojo/_base/lang",
], function(doh, identical, Memory, Observable, declare, lang){

	//test data set
	var toto = {id:"1", name: "toto", birthYear:1990};	
	var titi = {id:"2", name: "titi", job: "coder", birthYear:1980};
	var tata = {id:"3", name: "tata", job: "pilote", birthYear: 1980};
	var tutu = {id:"4", name: "tutu", job: "coder", birthYear: 1980};


	doh.i = doh.identical = function(expected, actual, sortArrays, hint){
		if (! identical(expected, actual, sortArrays)){
			throw new doh._AssertFailure("assertEqual() failed:\n\texpected\n\t\t"+JSON.stringify(expected)+"\n\tbut got\n\t\t"+JSON.stringify(actual)+"\n\n", hint);
		}
		return true;
	};


	doh.register("observable Memory store test", {
		"one level query observation": function(t){
			window.store = Observable(new Memory({data:[toto, titi, tata]}));
			window.queryResult = store.query({birthYear:1980});
			t.i([tata, titi], queryResult.slice(), true);
			t.t(queryResult.observe);
			window.changes=[];
			window.observeHandler = queryResult.observe(function(item, from, to){
				changes.push({
					item: item,
					// from: from,
					// to: to
				});
			}, true);
			store.put(tutu);
			t.i([{item: tutu}], changes, true);
			t.i([tata, titi, tutu], queryResult.slice(), true);
		},
		"two level query observation": function(t){
			window.store = Observable(new Memory({data:[toto, titi, tata]}));
			window.firstQueryResult = Observable(store.query({birthYear:1980}));
			t.i([tata, titi], firstQueryResult.slice(), true);
			t.t(firstQueryResult.observe);
			window.firstQueryResultChanges=[];
			window.observeHandler = firstQueryResult.observe(function(item, from, to){
				firstQueryResultChanges.push({
					item: item,
					// from: from,
					// to: to
				});
			}, true);
			window.secondQueryResult = firstQueryResult.query({job:"coder"});
			t.i([titi], secondQueryResult.slice(), true);
			t.t(secondQueryResult.observe);
			window.secondQueryResultChanges=[];
			window.observeHandler = secondQueryResult.observe(function(item, from, to){
				secondQueryResultChanges.push({
					item: item,
					// from: from,
					// to: to
				});
			}, true);
			store.put(tutu);

			t.i([{item: tutu}], firstQueryResultChanges, true);
			t.i([{item: tutu}], secondQueryResultChanges, true);

			t.i([tata, titi, tutu], firstQueryResult.slice(), true);
			t.i([titi, tutu], secondQueryResult.slice(), true);
		},
	});

});