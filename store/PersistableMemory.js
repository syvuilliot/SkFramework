define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/store/Memory",
], function(declare, lang, Memory){

	var copyOwnProperties = function(source, target) {
        Object.getOwnPropertyNames(source).forEach(function(propName) {
            Object.defineProperty(target, propName,
                Object.getOwnPropertyDescriptor(source, propName));
        });
        return target;
    };

	return declare([Memory], {
		key: "memoryStore",
		constructorIdProperty: "ConstructorId",
		getConstructorId: function(item){
			return item.constructor.name;
		},
		getConstructor: function(constructorId){
			return this.constructorsMap[constructorId];
		},
		constructorsMap: {},
		autoSave: true,

		constructor: function(params){
			if (! window.localStorage){throw("No localStorage available");}
			lang.mixin(this, params);
			this.load();
		},
		put: function(object, options){
			// if autoSave, persist MemoryStore when an item is added/updated
			var r = this.inherited(arguments);
			if(this.autoSave){this.save();}
			return r;
		},
		remove: function(id){
			// if autoSave, persist MemoryStore when an item is removed
			var r = this.inherited(arguments);
			if(this.autoSave){this.save();}
			return r;
		},
		load: function(){
			var createInstance = function(rawItem){
				var constructor = this.getConstructor(rawItem[this.constructorIdProperty]);
				delete rawItem[this.constructorIdProperty];
				return new constructor(rawItem);
			};
			var jsondata = localStorage[this.key];
			if (jsondata){
				data = JSON.parse(jsondata).map(createInstance.bind(this));
				this.setData(data);
			}
		},
		save: function(){
			var serialize = function(instance){
				var constructorId = this.getConstructorId(instance);
				rawItem = copyOwnProperties(instance, {});
				rawItem[this.constructorIdProperty] = constructorId;
				return rawItem;
			};
			var jsondata = this.data.map(serialize.bind(this));
			localStorage[this.key] = JSON.stringify(jsondata);
		}
	});
});