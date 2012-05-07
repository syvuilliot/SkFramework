define([
	"doh/runner",
	"SkFramework/model/Model",
	"dojo/_base/declare",
	"dojo/store/Memory",
], function(doh, Model, declare, Memory){

	//************* Models
	Model.store = new Memory();
	
	window.Person = declare("Sk.Person", [Model], {
		getage: function(){
			return 2012 - this.get("birthYear");
		},
		getchildren: function(){
			var union = this.get("motherOf");
			union.push(this.get("fatherOf"));
			return union;
		},
	});
	
	window.Todo = declare("Sk.Todo", [Model], {});
	
	window.Tag = declare("Sk.Tag", [Model], {});
	
	Model.addRelation({
		sourceModel: Todo,
		targetModel: Person,
		sourcePropertyName: "user",
		targetPropertyName: "todos",
		min: 1,
		max: 1,
	});
	
	Model.addRelation({
		sourceModel: Todo,
		targetModel: Tag,
		sourcePropertyName: "tags",
		targetPropertyName: "todos",
		min: 0,
		max: null,
	});
	
	Model.addRelation({
		sourceModel: Person,
		targetModel: Person,
		sourcePropertyName: "conjoint",
		targetPropertyName: "conjoint",
		min: 0,
		max: 1,
	});
	Model.addRelation({
		sourceModel: Person,
		targetModel: Person,
		sourcePropertyName: "father",
		targetPropertyName: "fatherOf",
		min: 0,
		max: 1,
	});
	Model.addRelation({
		sourceModel: Person,
		targetModel: Person,
		sourcePropertyName: "mother",
		targetPropertyName: "motherOf",
		min: 0,
		max: 1,
	});
	
//*********** Instances
	window.syv = new Person({
		id: "1",
		name: "Syv",
		birthYear: 1982,
	});
	syv.save();

	window.ket = new Person({name: "Ket"});
	ket.save();
	window.aur = new Person({name: "Aurélie"});
	aur.save();
	window.ant = new Person({name: "Antonin"});
	ant.add("father", syv);
	ant.add("mother", aur);
	ant.save();
	
	aur.add("conjoint", syv);
	aur.save();
	
	window.todo1 = new Todo({
		id: "2",
		title: "Concevoir la couche Model",
	});
	todo1.add("user", syv);
	todo1.save();
	
	window.todo2 = new Todo({id: "3", title: "Concevoir la couche UI"});
	todo2.add("user", syv);
	todo2.save();
	
	window.todo3 = new Todo({title:"Lancer Maponaute"});
	todo3.add("user", ket);
	todo3.save();
	
	window.tag1 = new Tag({label: "test"});
	tag1.save();
	window.tag2 = new Tag({label: "cool"});
	tag2.save();
	window.tag3 = new Tag({label: "top"});
	tag3.save();
	
	todo1.add("tags", tag1);
	todo1.add("tags", tag2);
	todo1.save();
	tag1.add("todos", todo2);
	todo2.save();

//******* Tests
	//function to compare that 2 arrays contain the same elements but possibly in a different order
	function sameArray(a1, a2){
		if (a1.length != a2.length){return false}
		var delta = false;
		a1.forEach(function(el){
			if(a2.indexOf(el) == -1){delta=true}
		});
		return !delta;
	};
	
	doh.register("Simple getter", function test0(t){
		t.is(30, syv.get("age"), "syv should be 30");
	});
	doh.register("Relation resolution", {
		"user of todo1": function (t){
			t.is(syv, todo1.get("user")[0], "The user of todo1 should be syv");
		},
		"syv's todos": function (t){
			t.t(sameArray(syv.get("todos"), [todo2, todo1]));
		},
		"todo1 tags": function(t){
			t.t(sameArray(todo1.get("tags"), [tag1, tag2]));
		},
		"todos with test tag": function(t){
			tag1.get("todos")
		},
	});
	doh.register("Models query", {
		"Person instances": function(t){
			//query based on declaredClass name
			t.t(sameArray(Model.store.query({declaredClass:"Sk.Person"}), [syv, aur, ket, ant]));
		},
		"all Model instances": function(t){
			//query based on isInstanceOf
			t.t(sameArray(Model.store.query(function(item){return item.isInstanceOf(Model)}), [syv, aur, ket, ant, todo1, todo2, todo3, tag1, tag2, tag3]));
		},
	});
	/*
	console.log("Les tags de la todo1 sont:", );
	console.log("Les todos tagguées 'test' sont:", );
	console.log("Le conjoint de syv est:", syv.get("conjoint"));
	console.log("Le conjoint de Aurélie est:", aur.get("conjoint"));
	console.log("Les enfants de Aurélie sont:", aur.get("children"));
	*/
});