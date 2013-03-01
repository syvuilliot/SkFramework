define([
	'../DataSource',
	'frb/bind',
	"dojo/store/Memory",
	"compose/compose",
	"dojo/Deferred",
	"dojo/promise/all",
], function(
	DataSource,
	bind,
	Memory,
	compose,
	Deferred,
	waitAll
) {
	// asyncMemory
	var AsyncMemory = compose(Memory, {
		get: compose.around(function(baseGet){
			return function(id){
				var results = baseGet.call(this, id);
				var dfd = new Deferred();
				setTimeout(function(){
					dfd.resolve(results);
				}, 2000);
				return dfd;
			};
		}),
		query: compose.around(function(baseQuery){
			return function(queryParams){
				// console.log("query called", arguments);
				var results = baseQuery.call(this, queryParams);
				var dfd = new Deferred();
				setTimeout(function(){
					dfd.resolve(results);
				}, 2000);
				return dfd;
			};
		}),
	});

	// Person Constructor
	function Person(fullName){
		this.fullName = fullName || "prenom nom";
	}
	Object.defineProperty(Person.prototype, "fullName", {
		get: function(){
			return this.firstName + " " + this.lastName;
		},
		// just for fun
		set: function(value){
			var names = value.split(" ");
			this.firstName = names[0];
			this.lastName = names[1];
		}
	});


	// Task constructor
	function Task(label, done, assignee){
		this.label = label || "";
		this.done = done || false;
		this.assignee = assignee;
	}
	Object.defineProperty(Task.prototype, "label", {
		set: function(value){
			if (this.done) {
				throw "Cannot change label of a closed task";
			} else {
				this._label = value;
			}
		},
		get : function(){
			return this._label;
		}
	});


	personsDataSource = new DataSource();
	personsDataSource.createResource = function(){
		return new Person();
	};
	personsDataSource.updateResource = function(person, data){
		// dans ce scenario, les données de la source écrasent les données locales
		person.firstName = data.firstName;
		person.lastName = data.lastName;
		return person;
	};


	tasksDataSource = new DataSource();
	tasksDataSource.createResource = function(args){
		return new Task("A faire", false);
	};
	tasksDataSource.updateResource = function(task, args){
		if (task.label !== args.label) {task.label = args.label;}
		task.done = args.done;
		// resolution de la relation "assignee"
		var assignee = personsDataSource.getResource(args && args.assigneeID);
		if (assignee !== task.assignee){ // s'il n'y a pas de changement, on ne fait rien
			personsDataSource.noMoreUsing(task.assignee); // on déclare ne plus utiliser l'ancien assignee
			personsDataSource.using(assignee); // on déclare utiliser le nouveau
			task.assignee = assignee;
		}
		return task;
	};
	tasksDataSource.forgetResource = function(task) {
		personsDataSource.noMoreUsing(task.assignee); // on déclare ne plus utiliser l'assignee
	};

	dataSource = new AsyncMemory({
		data: [{
			id: "A",
			done: false,
			label: "Tache A",
			assigneeID: "1",
		}, {
			id: "B",
			done: false,
			label: "Tache B",
			assigneeID: "1"
		}, {
			id: "C",
			done: false,
			label: "Tache C",
			assigneeID: "2"
		}]
	});
	tasksDataSource._source = dataSource;

	var TasksListsDataSource = DataSource.extend({
		_requestData: function(params) {
			return this._source.query(params);
		},
		createResource: function(args){
			return [];
		},
		updateResource: function(tasksList, data){
			data.forEach(function(rawTask, i){
				var task = tasksDataSource.getResource(rawTask.id);
				if (tasksList[i] !== task){ // s'il n'y a pas de changement, on ne fait rien
					tasksDataSource.noMoreUsing(tasksList[i]); // on déclare ne plus utiliser l'ancienne tâche
					tasksDataSource.using(task); // on déclare utiliser la nouvelle tâche
					tasksList[i] = task;
					// optionnel: on peut en profiter pour mettre à jour les données de la tâche
					tasksDataSource.updateResource(task, rawTask);
				}
			});
			// supprimer les taches en trop s'il y en a
			var delta = tasksList.length - data.length;
			if (delta > 0) {
				for (var i = 0; i++; i< delta){
					tasksList.pop();
				}
			}
			return tasksList;
		},
		forgetResource: function(tasksList) {
			tasksList.forEach(function(task){
				tasksDataSource.noMoreUsing(task);
			});
		},
	});

	tasksListsDataSource = new TasksListsDataSource({
		source: dataSource,
	});

	tasksByPersonDataSource = new TasksListsDataSource({
		source: dataSource,
	});
	tasksByPersonDataSource._personsRegistry = personsDataSource;
	tasksByPersonDataSource._requestData = function(person) {
		var personId = this._personsRegistry.getId(person);
		return this._source.query({assigneeID: personId});
	};

	console.log("Tests started");

	// on peut créer une ressource avec un simple id
	person1 = personsDataSource.getResource("1");
	console.assert(person1.firstName === "prenom", "la ressource doit être créée avec les valeurs par défaut du constructeur");
	console.assert(person1 === personsDataSource.getResource("1"), "une nouvelle ressource ne pas être créée pour cet id");
	personsDataSource.unregister(person1);
	console.assert(personsDataSource.hasResource(person1) === false, "La ressource ne doit plus être enregistrée");

	// ou en faisant
	person1 = new Person();
	personsDataSource.register(person1, "1");
	console.assert(personsDataSource.getId(person1) === "1", "La ressource doit être enregistrée avec l'id '1'");

	// si on appelle update avec des données brutes, la relation est résolue
	taskA = tasksDataSource.updateResource(new Task(), {
		done: false,
		label: "Tache A",
		assigneeID: "1"
	});
	console.assert(taskA.assignee === person1, "the assignee of taskA must be person1");
	console.assert(tasksDataSource.hasResource(taskA) === false, "la tache n'est pas pour antant enregistrée");
	console.assert(personsDataSource._rsc2usersCount.get(person1) === 1, "la résolution de relation a dû enregistrer un utilisateur pour cette ressource");

	// lorsque l'on souhaite oublier une resource, le compteur des resources liées doit baisser d'une unité
	// ce qui n'est pas le cas avec un simple "unregister"
	// mais normalement l'application n'a pas à utiliser cette méthode directement, elle doit se contenter de noMoreUsing
	tasksDataSource.register(taskA, "A");
	console.assert(tasksDataSource.hasResource(taskA) === true, "la tache A est connue");
	tasksDataSource.unregister(taskA);
	console.assert(tasksDataSource.hasResource(taskA) === false, "la tache A est oubliée");
	console.assert(personsDataSource.hasResource(person1) === false, "la person 1 est également oubliée car la tâche A était le seul utilisateur déclaré");

	var promises = [];
	function addTest (promise){
		promises.push(promise);
		return promise;
	}

	allTasks = tasksListsDataSource.getResource({});
	addTest(tasksListsDataSource.fetch(allTasks)).then(function(){
		console.assert(allTasks.length === 3, "il doit y avoir 3 tâches");
		console.assert(allTasks[0] === tasksDataSource.getResource("A"));
		console.assert(tasksDataSource._rsc2usersCount.get(tasksDataSource.getResource("A")) === 1);
		console.assert(tasksDataSource._rsc2usersCount.get(tasksDataSource.getResource("B")) === 1);
		console.assert(tasksDataSource._rsc2usersCount.get(tasksDataSource.getResource("C")) === 1);
		// puisque la function d'update de la liste de tâches en profite pour mettre à jour les tâches elles-même, on peut vérifier que les données sont à jour
		console.assert(allTasks[0].label === "Tache A");
		console.assert(allTasks[0].assignee === personsDataSource.getResource("1"));
		console.assert(personsDataSource._rsc2usersCount.get(personsDataSource.getResource("1")) === 2, "La personne 1 doit être déclarée comme utilisée par les 2 taches");

	});

	person1 = new Person();
	personsDataSource.register(person1, "1");
	person1.tasks = tasksByPersonDataSource.getResource(person1);
	addTest(tasksByPersonDataSource.fetch(person1.tasks)).then(function(){
		console.assert(person1.tasks.length === 2, "person1 doit avoir 2 tâches affectées");
		console.assert(person1.tasks[0] === tasksDataSource.getResource("A"));
	});

	waitAll(promises).then(function(){
		console.assert(person1.tasks[0] === allTasks[0]);
		console.assert(person1.tasks[1] === allTasks[1]);
		console.assert(tasksDataSource._rsc2usersCount.get(tasksDataSource.getResource("A")) === 2);
		console.assert(tasksDataSource._rsc2usersCount.get(tasksDataSource.getResource("B")) === 2);
		console.assert(tasksDataSource._rsc2usersCount.get(tasksDataSource.getResource("C")) === 1);
		tasksListsDataSource.unregister(allTasks);
		console.assert(tasksDataSource._rsc2usersCount.get(tasksDataSource.getResource("A")) === 1);
		console.assert(tasksDataSource._rsc2usersCount.get(tasksDataSource.getResource("B")) === 1);
		console.assert(tasksDataSource.hasResource("C") === false);
	});



	waitAll(promises).then(function(){
		console.log("Tests finished");
	});



});