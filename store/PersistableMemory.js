define([
	"dojo/_base/declare",
	"dojo/_base/lang",
], function(declare, lang){


	var Persistable = function(store, options){
		var wrappedStore = lang.delegate(store, {
			storageKey: options && options.storageKey || "memoryStore",
			constructorIdProperty: "ConstructorId",
			getConstructorId: function(item){
				return item.constructor.name;
			},
			getConstructor: function(constructorId){
				return this.constructorsMap[constructorId];
			},
			constructorsMap: {},
			autoSave: options && options.autoSave || false,

			put: function(object, options){
				// if autoSave, persist MemoryStore when an item is added/updated
				var r = store.put(object, options);
				if(this.autoSave){this.save();}
				return r;
			},
			remove: function(id){
				// if autoSave, persist MemoryStore when an item is removed
				var r = store.remove(id);
				if(this.autoSave){this.save();}
				return r;
			},
			load: function(){
				var jsondata = localStorage[this.storageKey];
				if (jsondata){
					var data = [];
					JSON.parse(jsondata).forEach(function(rawItem){
						var constructor = this.getConstructor(rawItem[this.constructorIdProperty]);
						if (typeof constructor !== "function") {
							console.warn("No constructor provided for item", rawItem);
						} else {
							delete rawItem[this.constructorIdProperty];
							data.push(new constructor(rawItem));
						}
					}.bind(this));
					store.setData(data);
				}
			},
			save: function(){
				var serialize = function(instance){
					var constructorId = this.getConstructorId(instance);
					var rawItem = JSON.parse(JSON.stringify(instance));
					rawItem[this.constructorIdProperty] = constructorId;
					return rawItem;
				};
				var rawData = store.query().map(serialize.bind(this));
				localStorage[this.storageKey] = JSON.stringify(rawData);
			},
			getJSON: function(){
				return localStorage[this.storageKey];
			},
			setJSON: function(json){
				localStorage[this.storageKey] = json;
			},
		});
		return lang.mixin(wrappedStore, options);
	};
	return Persistable;
});