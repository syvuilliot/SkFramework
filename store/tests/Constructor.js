define([
	"doh/runner",
	"../Constructor",
	"../LocalStorage",
	"dojo/_base/declare",
], function(doh, Constructor, LocalStorage, declare){
	var Person = declare("Person", [], {
		constructor: function(params){
			this.name = params.name;
		},
		describe: function(){
			return "my name is "+this.name;
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
	
	window.toto = new Person({name: "toto"});
	var totoId = store.put(toto);
	
	window.titi = new Worker({name: "titi", job: "coder"});
	var titiId = store.put(titi);
	
	window.allInstances = store.query({});
	
	doh.register("Constructor store test",[
		function personInstance(t){
			t.is("my name is toto", store.get(totoId).describe());
		},
		function workerInstance(t){
			t.is("my name is titi and my job is coder", store.get(titiId).describe());
		},
		function query(t){
			t.is(2, allInstances.total);
			allInstances.forEach(function(item){
				t.t(item.describe);
			});
		},
	]);
	
});
