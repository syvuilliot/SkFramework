define([
    'SkFramework/model/DataSource',
    'frb/bind',
    "dojo/store/Memory",
    "compose/compose",
    "dojo/Deferred",
], function(
    DataSource,
    bind,
    Memory,
    compose,
    Deferred
) {
    // asyncMemory
    var AsyncMemory = compose(Memory, {
        get: compose.around(function(baseQuery){
            return function(queryParams){
                // console.log("query called", arguments);
                results = baseQuery.call(this, queryParams);
                dfd = new Deferred();
                setTimeout(function(){
                    dfd.resolve(results);
                }, 2000);
                return dfd;
            }
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
        if (task.label !== args.label) {task.label = args.label};
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
        this.unregister(task);
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

        }]
    });
    tasksDataSource._source = dataSource;


    tasksListsDataSource = new DataSource();
    tasksListsDataSource._source = new AsyncMemory({
        data: [{
            id: "all",
            items: ["A", "B"],
        }, {
            id: "first",
            items: ["A"],
        }, {
            id: "random",
            items: ["A", "B", "A"],
        }],
    });
    tasksListsDataSource.createResource = function(args){
        return [];
    };
    tasksListsDataSource.updateResource = function(tasksList, data){
        data.items.forEach(function(id, i){
            var task = tasksDataSource.getResource(id);
            if (tasksList[i] !== task){ // s'il n'y a pas de changement, on ne fait rien
                tasksDataSource.noMoreUsing(tasksList[i]); // on déclare ne plus utiliser l'ancienne tâche
                tasksDataSource.using(task); // on déclare utiliser la nouvelle tâche
                tasksList[i] = task;
            }
        });
        // supprimer les taches en trop s'il y en a
        var delta = tasksList.length - data.items.length;
        if (delta > 0) {
            for (var i = 0; i++; i< delta){
                    tasksList.pop();
                }
            }
            return tasksList;
        };
        tasksListsDataSource.forgetResource = function(tasksList) {
        };


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
        tasksDataSource.register(taskA, "A");
        console.assert(tasksDataSource.hasResource(taskA) === true, "la tache A est connue");
        tasksDataSource.forgetResource(taskA);
        console.assert(tasksDataSource.hasResource(taskA) === false, "la tache A est oubliée");
        console.assert(personsDataSource.hasResource(person1) === false, "la person 1 est également oubliée car la tâche A était le seul utilisateur déclaré");

        allTasks = tasksListsDataSource.getResource("all");
        tasksListsDataSource.fetch(allTasks).then(function(){
            console.assert(allTasks[0] === tasksDataSource.getResource("A"));
            console.assert(tasksDataSource._rsc2usersCount.get(tasksDataSource.getResource("A")) === 1);
            console.assert(tasksDataSource._rsc2usersCount.get(tasksDataSource.getResource("B")) === 1);
        });


/*

            // fetch data
            var query = {};
            tasksDataSource.fetch(query);
            console.assert(tasksDataSource.get("A") && tasksDataSource.get("B"), "Les taches A et B doivent être présentes");

            // unregister query and clean registry
            tasksDataSource.removeQuery(query);
            tasksDataSource.clean();
            console.assert(!tasksDataSource.has("A") && !tasksDataSource.has("B"), "Les taches A et B ne doivent plus être présentes");


            // fetch, change data on server and fetch again
            tasksDataSource.fetch(query);
            console.assert(tasksDataSource.get("A") && tasksDataSource.get("B"), "Les taches A et B doivent être présentes");
            // add ressource
            dataSource.put({
                id: "C",
                done: true,
                label: "Tache C",
                assigneeID: "2"
            });
            taskA = tasksDataSource.get("A");
            tasksDataSource.fetch(query);
            console.assert(tasksDataSource.get("A") && tasksDataSource.get("B") && tasksDataSource.get("C"), "Les taches A, B et C doivent être présentes");
            console.assert(tasksDataSource.get("A") === taskA, "La tache A doit rester le même objet");
            // update ressource
            dataSource.put({
                id: "A",
                done: true,
                label: "Tache A modifiée",
                assigneeID: "1"
            });
            tasksDataSource.fetch(query);
            console.assert(tasksDataSource.get("A") === taskA, "La tache A doit rester le même objet");
            // delete ressource
            dataSource.remove("B");
            tasksDataSource.fetch(query);
            tasksDataSource.clean();
            console.assert(!tasksDataSource.has("B"), "La tache B ne doit plus être présente");
*/
        console.log("End of tests. (if no error were thrown, that's a success)");
});