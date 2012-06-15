define([
	"doh/runner",
	"SkFramework/utils/identical",
	"../Model2",
	"SkFramework/utils/create",
	"dojo/store/Memory",
	"SkFramework/store/Constructor",
	"SkFramework/store/LocalStorage",
	"SkFramework/store/SimpleQueryEngineGet",
	"SkFramework/store/RqlQueryEngineGet",	
], function(doh, identical, Model, create, Memory, Constructor, LocalStorage, SimpleQueryEngineGet, RqlQueryEngineGet){

	doh.i = doh.identical = function(expected, actual, sortArrays, hint){
		if (! identical(expected, actual, sortArrays)){
			throw new doh._AssertFailure("assertEqual() failed:\n\texpected\n\t\t"+JSON.stringify(expected)+"\n\tbut got\n\t\t"+JSON.stringify(actual)+"\n\n", hint);
		}
		return true;
	};

	//************* Models
	function setUpModels(){
		window.Person = create(Model, function Person(){ //need to give a constructor name for Constructor(new LocalStorage) to work
				Model.apply(this, arguments);
			}, {
			getage: function(){
				return 2012 - this.get("birthYear");
			},
			getchildren: function(){
				var union = this.get("motherOf");
				union.push(this.get("fatherOf"));
				return union;
			},
			describe: function(){
				return "My name is " + this.get("name") + " and I'm " + this.get("age");
			},
		});

		window.Employee = create(Person, function Employee(){ //need to give a constructor name for Constructor(new LocalStorage) to work
				Person.apply(this, arguments);
			}, {
			describe : function(){
				return this.super.describe.call(this) + " and I work as " + this.get("job");
			},
		});
		
		window.Todo = create(Model, function Todo(){ //need to give a constructor name for Constructor(new LocalStorage) to work
				Model.apply(this, arguments);
		});
		
		window.Tag = create(Model, function Tag(){ //need to give a constructor name for Constructor(new LocalStorage) to work
				Model.apply(this, arguments);
		});

		window.TodoTagRelation = create(Model, function TodoTagRelation(){ //need to give a constructor name for Constructor(new LocalStorage) to work
				Model.apply(this, arguments);
		});
		
		Todo.addRelationTo(Person, {
			sourcePropertyName: "responsible",
			targetPropertyName: "todos",
			min: 1,
			max: 1,
		});
		
		TodoTagRelation.addRelationTo(Tag, {
			sourcePropertyName: "tag",
			targetPropertyName: "todos",
			min: 0,
			max: null,
		});
		TodoTagRelation.addRelationTo(Todo, {
			sourcePropertyName: "todo",
			targetPropertyName: "tags",
			min: 0,
			max: null,
		});
		
/*		Model.addRelation({
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
*/	}

	//************* Instances
	function setUpInstances(){		
		window.syv = new Employee({
			id: "1",
			name: "Syv",
			birthYear: 1982,
			job: "consultant"
		});
		syv.save();

		window.ket = new Employee({name: "Ket", birthYear: 1986, job: "coder"});
		ket.save();
		window.aur = new Employee({name: "Aurélie", birthYear: 1982, job: "catman"});
		aur.save();
		window.ant = new Person({name: "Antonin"});
		// ant.add("father", syv);
		// ant.add("mother", aur);
		ant.save();
		
		// aur.add("conjoint", syv);
		// aur.save();
		
		window.todo1 = new Todo({
			id: "2",
			title: "Concevoir la couche Model",
		});
		todo1.set("responsible", syv);
		todo1.save();
		
		window.todo2 = new Todo({id: "3", title: "Concevoir la couche UI"});
		todo2.set("responsible", syv);
		todo2.save();
		
		window.todo3 = new Todo({title:"Lancer Maponaute"}).save();
		// todo3.set("user", ket);
		// todo3.save();
		ket.get("todos").add(todo3).save();
		
		window.testTag = new Tag({label: "test"}).save();
		window.coolTag = new Tag({label: "cool"}).save();
		window.topTag = new Tag({label: "top"}).save();
		
		var todoTagRel1 = new TodoTagRelation();
		todoTagRel1.set("tag", testTag);
		todoTagRel1.save();
		todo1.get("tags").add(todoTagRel1).save();
		// todo1.get("tags").add({tag: testTag}).save();
		
		var todoTagRel2 = new TodoTagRelation();
		todoTagRel2.set("tag", coolTag);
		todoTagRel2.save();
		todo1.get("tags").add(todoTagRel2).save();

		testTag.get("todos").add(new TodoTagRelation({
			todo: todo2,
		})).save();
	}
	
//******* Tests
	
	testSet = {
		"Simple getter": function(t){
			t.i(30, syv.get("age"), "syv should be 30");
		},
		"user of todo1": function (t){
			t.i(syv, todo1.get("responsible"), "The responsible of todo1 should be syv");
		},
		"syv's todos": function (t){
			t.i([todo2, todo1], syv.get("todos"), true);
		},
		"todo1 tags": function(t){
			t.i([testTag, coolTag], todo1.get("tags").map(function(item){return item.get("tag");}), true);
		},
		"todos with test tag": function(t){
			t.i([todo1, todo2], testTag.get("todos").map(function(item){return item.get("todo");}), true);
		},
		"Person instances": function(t){
			t.i([syv, aur, ket, ant], Person.query({}), true);
		},
		"Employee instances": function(t){
			t.i([syv, aur, ket], Employee.query({}), true);
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
			queryEngine: SimpleQueryEngineGet,
		});
		setUpModels();
		setUpInstances();
	});
	
/*	doh.register("Tests with LocalStorage store", testSet, function setUp(){
		setUpModels();
		Model.store = Constructor(new LocalStorage({
			queryEngine: SimpleQueryEngineGet,
		}), {
			constructorsMap: {
				Employee: Employee,
				Person: Person,
				Todo: Todo,
				Tag: Tag,
			},
		});
		Model.store.clear();
		setUpInstances();
	});
*/	
});