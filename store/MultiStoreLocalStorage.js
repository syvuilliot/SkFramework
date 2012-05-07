define([
	"dojo/_base/lang",
	"dojo/_base/declare",
	"infocarte/store/LocalStorage",
 	"dojo/store/util/QueryResults",
],
function(lang, declare, LocalStorage, QueryResults){
	//specialisation of LocalStorage to enable multi stores via namespacing
	return declare([LocalStorage], {
		//default store id if none is specified at instanciation
		storeId: "default",
		nameSpacedKey: function(key){
			return this.storeId + "_" + key;
		},
		_keyInNameSpace: function(key){
			var nameSpace = this.storeId + "_";
			if (key.slice(0, nameSpace.length) === nameSpace){return true;}
			return false;
		},
		get: function(id){
			//return LocalStorage.get(this.nameSpacedKey(id));
			//id = this.nameSpacedKey(id);
			return this.inherited(arguments, [this.nameSpacedKey(id)]);;
		},
		persist: function(id, object){
			this.inherited(arguments, [this.nameSpacedKey(id), object]);
		},
		remove: function(id){
			//return LocalStorage.remove(this.nameSpacedKey(id));
			return this.inherited(arguments, [this.nameSpacedKey(id)]);
		},
		query: function(query, options){
			//copy/pasted from LocalStorage implementation
			//better way of doing this ?
			var data=[];
			for (var i=0; i<localStorage.length;i++){
				var key = localStorage.key(i);
				if (this._keyInNameSpace(key)){
					//TODO: should call super method "get" instead of rewriting it
					var item = JSON.parse(localStorage.getItem(key));
					data.push(item);
				}
			}		
			return QueryResults(this.queryEngine(query, options)(data));
		},
		
	});
});