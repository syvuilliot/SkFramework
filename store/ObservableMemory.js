define(["SkFramework/utils/create", "./Memory", "dojo/store/Observable"],
function(create, Memory, Observable){

	// summary:
	//		This is a basic in-memory object store subcalssing Array and implementing the dojo.store.api.Store.
	//		QueryResults also implement this store API

var ObservableMemory = create(Memory, function ObservableMemoryStore(options){
	return Observable(new Memory(options)); //the constructor invoquation should return that instead of "this"
	}, {
	query: function(query, options){
		var subStore = new ObservableMemory({data: this.queryEngine(query, options)(this)});
		subStore.observe(); //in order to initiate the observing mechanism
		return subStore;
	},
});
return Memory;

});
