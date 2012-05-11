define([
	"doh/runner",
	"SkFramework/utils/array",
	"../Constructor",
	"../LocalStorage",
	"dojo/_base/declare",
], function(doh, arrayUtils, Constructor, LocalStorage, declare){
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
	
	localStorage.clear();
	
	window.store = Constructor(new LocalStorage, {
		constructorsMap: {
			Person: Person,
			Worker: Worker,
		}
	});
	
	window.toto = new Person({id:"1", name: "toto", birthYear:1990});
	var totoId = store.put(toto);
	
	window.titi = new Worker({id:"2", name: "titi", job: "coder", birthYear:1980});
	var titiId = store.put(titi);
	
	var sameArray = arrayUtils.sameArray;
	
	doh.register("Constructor store test",[
		function personInstance(t){
			t.is(toto, store.get(totoId));
			t.is("my name is toto", store.get(totoId).describe());
		},
		function workerInstance(t){
			t.is(titi, store.get(titiId));
			t.is("my name is titi and my job is coder", store.get(titiId).describe());
		},
		function queryAll(t){
			window.allInstances = store.query({});
			t.is(2, allInstances.total);
			t.t(sameArray([toto, titi], allInstances));
			allInstances.forEach(function(item){
				t.t(item.describe);
			});
		},
		function queryOnInstanceMethod(t){
			window.moreThanThirty = store.query(function(item){return item.getAge()>30});
			t.t(sameArray([titi], moreThanThirty));
		},
	]);
	
});
