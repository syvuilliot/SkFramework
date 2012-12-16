define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"./Memory",
], function(declare, lang, Memory){

	var copyOwnProperties = function(source, target) {
        Object.getOwnPropertyNames(source).forEach(function(propName) {
            Object.defineProperty(target, propName,
                Object.getOwnPropertyDescriptor(source, propName));
        });
        return target;
    };

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
			var createInstance = function(rawItem){
				var constructor = this.getConstructor(rawItem[this.constructorIdProperty]);
				delete rawItem[this.constructorIdProperty];
				return new constructor(rawItem);
			};
			var jsondata = localStorage[this.storageKey];
			if (jsondata){
				var data = JSON.parse(jsondata).map(createInstance.bind(this));
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
			var jsondata = store.query().map(serialize.bind(this));
			localStorage[this.storageKey] = JSON.stringify(jsondata);
		}
	});
	return lang.mixin(wrappedStore, options);
	};
	return Persistable;
});