define([
	"doh/runner",
	"dojo/store/Memory",
	"SkFramework/store/LocalStorage",
	"../Mirror",
], function(doh, Memory, LocalStorage, Mirror){


	window.myMemoryStore = new Memory({});
	window.myLocalStorage = new LocalStorage();
	myLocalStorage.clear();
	window.sync = new Mirror({
		local: myMemoryStore,
		remote: myLocalStorage
	});


	doh.register("Stores synchronise", {
		"put": function(t){
			var toto = {id: "1", name:"toto", age: 30};
			var totoId = myMemoryStore.put(toto);
			t.is(toto, myLocalStorage.get(totoId));
		},
		"query": function(t){
			var titi = {id: "2", name:"titi", age:30};
			myLocalStorage.put(titi);
			var thirty = myMemoryStore.query({age:30});
			t.is(titi, myMemoryStore.get("2"));
		}
		// "add"
		// "remove"
	});
});