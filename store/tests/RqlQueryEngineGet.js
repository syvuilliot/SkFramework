define([
	"doh/runner",
	"SkFramework/utils/create",
	"dojo/store/Memory",
	'SkFramework/store/RqlQueryEngineGet',
	"SkFramework/utils/identical",
	"SkFramework/model/Model",
], function(doh, create, Memory, RqlQueryEngine, identical, Model){
	doh.i = doh.identical = function(expected, actual, sortArrays, hint){
		if (! identical(expected, actual, sortArrays)){
			throw new doh._AssertFailure("assertEqual() failed:\n\texpected\n\t\t"+JSON.stringify(expected)+"\n\tbut got\n\t\t"+JSON.stringify(actual)+"\n\n", hint);
		}
		return true;
	};

	window.Person = create(Model, function Person(params){
		Model.apply(this, arguments);
	}, {
		getage: function(){
			return 2012 - this.get("birthYear");
		},
		describe: function(){
			return "My name is " + this.get("name") + " and I'm " + this.get("age");
		},
	});
	window.Employee = create(Person, function Employee(params){
		Person.apply(this, arguments);
	}, {
		describe : function(){
			return this.super.describe.call(this) + " and I work as " + this.get("job");
		},
	});
	
	window.toto1 = new Employee({id:"1", name:"toto1", job:"farmer", address: {city:"Paris", country:"France"}, colors:["blue", "red", "white"]});
	window.toto2 = new Employee({id:"2", name:"toto2", job:"farmer", address: {city:"Roma", country:"Italy"}, colors:["red", "white"], birthYear:1982});
	window.toto3 = new Employee({id:"3", name:"toto3", job:"farmer", address: {city:"Paris", country:"France"}, birthYear:1982});
	window.toto4 = new Employee({id:"4", name:"toto4", job:"pilote", country:"France", colors:["blue", "yellow"], birthYear:1972});
	window.toto5 = new Employee({id:"5", name:"toto5", job:"pilote", country:"Italy", birthYear:1992});
	window.toto10 = new Person({id:"10", name:"toto10", birthYear:1992});
	
	window.store = new Memory({
		data: [
			toto1,
			toto2,
			toto3,
			toto4,
			toto5,
			toto10,
		],
		queryEngine: RqlQueryEngine,
	});
	
	doh.register("RqlQueryEngine",{
		simple: function(t){
			t.i([toto1], store.query("name=toto1"));
		},
		and: function(t){
			t.i([toto5], store.query("job=pilote&country=Italy"));
		},
		in: function(t){
			t.i([toto1, toto2], store.query("in(id,(string:1,string:2))"));
		},
		nested: function(t){
			t.i([toto1, toto3], store.query("job=farmer&address/country=France"));
		},
		contains: function(t){
			t.i([toto1, toto4], store.query("contains(colors,blue)"));
		},
		derivedProperty: function(t){
			t.i([toto2, toto3, toto4], store.query("ge(age,30)"));
		},
		instanceof: function(t){
			t.i([toto1, toto2, toto3, toto4, toto5, toto10], store.query("instanceof(Person)"));
		}
	});
});