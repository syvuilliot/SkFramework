define([
	"doh/runner",
	"../../utils/identical",
	"../Model",
	"../../utils/create",
	"dojo/store/Memory",
	"../../store/Constructor",
	"../../store/LocalStorage",
	"../../store/SimpleQueryEngineGet",
	"../../store/RqlQueryEngineGet",	
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
		

//		window.PersonTodoRelation

		Todo.addRelationTo(Person, {
			sourcePropertyName: "user",
			targetPropertyName: "todos",
		});
		
		
	}

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
		ant.save();
		
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
		
	}
	
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
		"Person instances": function(t){
			t.i([syv, aur, ket, ant], Person.query({}), true);
		},
		"Employee instances": function(t){
			t.i([syv, aur, ket], Employee.query({}), true);
		},
		"Thirty years old": function(t){
			t.i([syv, aur], Person.query({age: 30}), true);
		},
	};
	
	doh.register("Tests with Memory store", testSet, function setUp(){
		setUpModels();
		Person.store = new Memory({
			queryEngine: SimpleQueryEngineGet,
		});
		Todo.store = new Memory({
			queryEngine: SimpleQueryEngineGet,
		});
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