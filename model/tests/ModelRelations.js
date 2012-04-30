define([
	"doh/runner",
	"SkFramework/model/Model",
	"dojo/_base/declare",
	"dojo/store/Memory",
], function(doh, Model, declare, Memory){

	//************* Models
	Model.store = new Memory();
	
	var Person = declare("Sk.Person", [Model], {
		getage: function(){
			return 2012 - this.get("birthYear");
		},
		getchildren: function(){
			var self = this;
			return instancesRegistry.query(function(item){
				return item.isInstanceOf(Person) && (item.father.indexOf(self.getIdentity()) >= 0 || item.mother.indexOf(self.getIdentity()) >= 0);
			});
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
	
//*********** Tests
	window.syv = new Person({
		id: "1",
		name: "Syv",
		birthYear: 1982,
	});

	doh.register("Simple getter test", function(t){
		t.is(syv.get("age"), 30, "syv should be 30");
	});
	/*
	window.ket = new Person({name: "Ket"});
	window.aur = new Person({name: "Aurélie"});
	window.ant = new Person({name: "Antonin"});
	ant.add("father", syv);
	ant.add("mother", aur);
	
	aur.add("conjoint", syv);
	
	window.todo1 = new Todo({
		id: "2",
		title: "Concevoir la couche Model",
		//user: syv,
	});
	todo1.add("user", syv);
	
	window.todo2 = new Todo({id: "3", title: "Concevoir la couche UI"});
	todo2.add("user", syv);
	
	window.todo3 = new Todo({title:"Lancer Maponaute"});
	todo3.add("user", ket);
	
	window.tag1 = new Tag({label: "test"});
	window.tag2 = new Tag({label: "cool"});
	window.tag3 = new Tag({label: "top"});
	
	todo1.add("tags", tag1);
	todo1.add("tags", tag2);
	tag1.add("todos", todo2);

	console.log("L'age de syv est:", syv.get("age"));
	console.log("Le nom du responsable de la tache 1 est :", todo1.get("user")[0].get("name"));
	console.log("Les taches de Syv sont:", syv.get("todos"));
	console.log("Les personnes connues dans l'application sont:", instancesRegistry.query({declaredClass:"Sk.Person"}));//permet de retrouver les instances directes d'une classe
	console.log("Les instances de Model connues dans l'application sont:", instancesRegistry.query(function(item){return item.isInstanceOf(Model)}));//permet de retrouver les instances d'une classe et de ses sous classes
	console.log("Les tags de la todo1 sont:", todo1.get("tags"));
	console.log("Les todos tagguées 'test' sont:", tag1.get("todos"));
	console.log("Le conjoint de syv est:", syv.get("conjoint"));
	console.log("Le conjoint de Aurélie est:", aur.get("conjoint"));
	console.log("Les enfants de Aurélie sont:", aur.get("children"));
	*/

});