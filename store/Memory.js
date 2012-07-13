define(["SkFramework/utils/create", "dojo/store/util/QueryResults", "dojo/store/util/SimpleQueryEngine" /*=====, "./api/Store" =====*/],
function(create, QueryResults, SimpleQueryEngine /*=====, Store =====*/){

	// summary:
	//		This is a basic in-memory object store that implements dojo.store.api.Store.

var Memory = create(Array, function MemoryStore(options){
		this.setData(options && options.data || []);
/*		delete options.data;
		for(var i in options){
			this[i] = options[i];
		}
*/	}, {

	idProperty: "id",

	index:null,

	queryEngine: SimpleQueryEngine,

	get: function(id){
		return this[this.index[id]];
	},
	getIdentity: function(object){
		return object[this.idProperty];
	},
	put: function(object, options){
		var data = this,
			index = this.index,
			idProperty = this.idProperty;
		var id = object[idProperty] = (options && "id" in options) ? options.id : idProperty in object ? object[idProperty] : Math.random();
		if(id in index){
			// object exists
			if(options && options.overwrite === false){
				throw new Error("Object already exists");
			}
			// replace the entry in data
			data[index[id]] = object;
		}else{
			// add the new object
			index[id] = data.push(object) - 1;
		}
		return id;
	},
	add: function(object, options){
		(options = options || {}).overwrite = false;
		// call put with overwrite being false
		return this.put(object, options);
	},
	remove: function(id){
		var index = this.index;
		var data = this.slice();
		if(id in index){
			data.splice(index[id], 1);
			// now we have to reindex
			this.setData(data);
			return true;
		}
	},
	query: function(query, options){
		return new Memory({data: this.queryEngine(query, options)(this)});
	},
	setData: function(data){
		//	summary:
		//		Sets the given data as the source for this store, and indexes it
		//	data: Object[]
		//		An array of objects to use as the source of data.
		if(data.items){
			// just for convenience with the data format IFRS expects
			this.idProperty = data.identifier;
			data = data.items;
		}
		//remove all existing items
		this.splice(0);
		//add new items
		data.forEach(function(item){
			this.push(item);
		}.bind(this));
		//index items
		this.index = {};
		for(var i = 0, l = this.length; i < l; i++){
			this.index[this[i][this.idProperty]] = i;
		}
	}
});
return Memory;

});
