define([
	"doh/runner",
	"SkFramework/utils/identical",
	"../Model",
	"SkFramework/utils/create",
	"dojo/store/Memory",
	"SkFramework/store/Constructor",
	"SkFramework/store/LocalStorage",
	"SkFramework/store/SimpleQueryEngineGet",
], function(doh, identical, Model, create, Memory, Constructor, LocalStorage, SimpleQueryEngineGet){

	doh.i = doh.identical = function(expected, actual, sortArrays, hint){
		if (! identical(expected, actual, sortArrays)){
			throw new doh._AssertFailure("assertEqual() failed:\n\texpected\n\t\t"+JSON.stringify(expected)+"\n\tbut got\n\t\t"+JSON.stringify(actual)+"\n\n", hint);
		}
		return true;
	};

	//************* Models
	function setUpModels(){		
		window.Person = create(Model, function Person(){
				this.superConstructor.apply(this, arguments);
			}, {
			getage: function(){
				return 2012 - this.get("birthYear");
			},
			getchildren: function(){
				var union = this.get("motherOf");
				union.push(this.get("fatherOf"));
				return union;
			},
		});
		
		window.Todo = create(Model, function Todo(){
				this.superConstructor.apply(this, arguments);
		});
		
		window.Tag = create(Model, function Tag(){
				this.superConstructor.apply(this, arguments);
		});
		
		Todo.addRelationTo(Person, {
			sourcePropertyName: "user",
			targetPropertyName: "todos",
			min: 1,
			max: 1,
		});
		
		Todo.addRelationTo(Tag, {
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
	};
	
	//************* Instances
	function setUpInstances(){		
		window.syv = new Person({
			id: "1",
			name: "Syv",
			birthYear: 1982,
		});
		syv.save();

		window.ket = new Person({name: "Ket"});
		ket.save();
		window.aur = new Person({name: "Aurélie", birthYear:1982});
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
	};
	
//******* Tests
	
	testSet = {
		"Simple getter": function(t){
			t.is(30, syv.get("age"), "syv should be 30");
		},
		"user of todo1": function (t){
			t.is(syv, todo1.get("user")[0], "The user of todo1 should be syv");
		},
		"syv's todos": function (t){
			t.i([todo2, todo1], syv.get("todos"), true);
		},
		"todo1 tags": function(t){
			t.i([tag1, tag2], todo1.get("tags"), true);
		},
		"todos with test tag": function(t){
			t.i([todo1, todo2], tag1.get("todos"), true);
		},
		"all Model instances": function(t){
			//t.i(Model.store.query(function(item){return item instanceof Model}), [syv, aur, ket, ant, todo1, todo2, todo3, tag1, tag2, tag3], true);
			t.i([syv, aur, ket, ant, todo1, todo2, todo3, tag1, tag2, tag3], Model.query({}), true);
		},
		"Person instances": function(t){
			t.i([syv, aur, ket, ant], Person.query({}), true);
		},
		"Thirty years old": function(t){
			t.i([syv, aur], Model.store.query({age: 30}), true);
		},
	/*
	console.log("Le conjoint de syv est:", syv.get("conjoint"));
	console.log("Le conjoint de Aurélie est:", aur.get("conjoint"));
	console.log("Les enfants de Aurélie sont:", aur.get("children"));
	*/
		
	};
	
	doh.register("Tests with Memory store", testSet, function setUp(){
		Model.store = new Memory({
			queryEngine: SimpleQueryEngineGet
		});
		setUpModels();
		setUpInstances();
	});
	
	doh.register("Tests with LocalStorage store", testSet, function setUp(){
		setUpModels();
		Model.store = Constructor(new LocalStorage({
			queryEngine: SimpleQueryEngineGet,
		}), {
			constructorsMap: {
				Person: Person,
				Todo: Todo,
				Tag: Tag,
			},
		});
		Model.store.clear();
		setUpInstances();
	});
	
});