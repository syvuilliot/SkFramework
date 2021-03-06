﻿define([
	"doh/runner",
	"../../utils/identical",
	"../Constructor",
	"../LocalStorage",
	"dojo/_base/declare",
], function(doh, identical, Constructor, LocalStorage, declare){

	var Person = declare("Person", [], {
		constructor: function(params){
			this.id  = params.id;
			this.name = params.name;
			this.birthYear = params.birthYear;
		},
		describe: function(){
			return "my name is "+this.name;
		},
		getAge: function(){
			return 2012 - this.birthYear;
		}
	});
	
	var Worker = declare("Worker", [Person], {
		constructor: function(params){
			this.job = params.job;
		},
		describe: function(){
			var superDescription = this.inherited(arguments);
			return superDescription + " and my job is " + this.job;
		}
	});
	
	
	window.store = Constructor(new LocalStorage, {
		constructorsMap: {
			Person: Person,
			Worker: Worker,
		}
	});
	store.clear();
	
	window.toto = new Person({id:"1", name: "toto", birthYear:1990});
	var totoId = store.put(toto);
	
	window.titi = new Worker({id:"2", name: "titi", job: "coder", birthYear:1980});
	var titiId = store.put(titi);
	
	doh.i = doh.identical = function(expected, actual, sortArrays, hint){
		if (! identical(expected, actual, sortArrays)){
			throw new doh._AssertFailure("assertEqual() failed:\n\texpected\n\t\t"+JSON.stringify(expected)+"\n\tbut got\n\t\t"+JSON.stringify(actual)+"\n\n", hint);
		}
		return true;
	};


	doh.register("Constructor store test", {
		"Person instance": function(t){
			t.i(toto, store.get(totoId));
			t.i("my name is toto", store.get(totoId).describe());
		},
		"Worker instance": function(t){
			t.i(titi, store.get(titiId));
			t.i("my name is titi and my job is coder", store.get(titiId).describe());
		},
		"query all": function(t){
			window.allInstances = store.query({});
			t.i(2, allInstances.total);
			t.i([toto, titi], allInstances, true);
			t.i([titi, toto], allInstances, true);//for t.i test... not related to Constructor test :-)
			allInstances.forEach(function(item){
				t.t(item.describe);
			});
		},
		"queryOnInstanceMethod": function(t){
			window.moreThanThirty = store.query(function(item){return item.getAge()>30});
			t.i([titi], moreThanThirty);
		},
	});
	
});
