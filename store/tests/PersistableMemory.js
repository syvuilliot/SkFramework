define([
	"doh/runner",
	"../../utils/identical",
	"../Memory",
	"../PersistableMemory",
	"dojo/_base/declare",
	"dojo/_base/lang",
], function(doh, identical, Memory, Persistable, declare, lang){

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
		
	var toto = new Person({id:"1", name: "toto", birthYear:1990});	
	var titi = new Worker({id:"2", name: "titi", job: "coder", birthYear:1980});
	var tata = new Person({id:"3", name: "tata", birthYear: 1980});

	var params = {
		key: "testPersistableMemory",
		constructorsMap: {
			Person: Person,
			Worker: Worker,
		},
		getConstructorId: function(item){
			return item.declaredClass;
		},
	};
	
	doh.i = doh.identical = function(expected, actual, sortArrays, hint){
		if (! identical(expected, actual, sortArrays)){
			throw new doh._AssertFailure("assertEqual() failed:\n\texpected\n\t\t"+JSON.stringify(expected)+"\n\tbut got\n\t\t"+JSON.stringify(actual)+"\n\n", hint);
		}
		return true;
	};


	doh.register("PersistableMemory store test", {
		"saveAndLoad": function(t){
			delete localStorage.testPersistableMemory;
			//var paramsAndData = lang.mixin({}, params, {data: });
			window.store = Persistable(new Memory({data: [toto, titi]}), params);
			store.save();
			window.store = Persistable(new Memory(), params);
			store.load();
			t.i([toto, titi], store.query().slice(), true);
			t.t(store.get("1") instanceof Person);
			t.t(store.get("2") instanceof Worker);
		},
		"autoSave on put": function(t){
			delete localStorage.testPersistableMemory;
			window.store = Persistable(new Memory(), params);
			store.put(titi);
			window.store = Persistable(new Memory(), params);
			store.load();
			t.i([titi], store.query().slice(), true);
			t.t(store.get("2") instanceof Person);
			t.t(store.get("2") instanceof Worker);
		},
		"autoSave on remove": function(t){
			delete localStorage.testPersistableMemory;
			window.store = Persistable(new Memory({data:[toto, titi]}), params);
			store.remove("2");
			window.store = Persistable(new Memory(), params);
			store.load();
			t.i([toto], store.query().slice(), true);
			t.t(store.get("1") instanceof Person);
		},
	});
	
});
