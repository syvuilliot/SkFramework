﻿define([
	"dojo/_base/lang",
	"dojo/_base/Deferred",
	"dojo/store/util/QueryResults",
],function(lang, Deferred, QueryResults) {

var Constructor = function(store, options){
	/*
	summary:
		make possible to persist the constructor id of items and to call it automatically when retriving an item
	store:
		the store to apply this wrapper
	options:
		* constructorIdProperty : the property name in which the constructorId is stored. "ConstructorId" by default
		* getConstructorId(item): function that is passed an item and which return its constructorId. This function is available via 'storeWithConstructor.getConstructorId'. By default it return "declaredClass" value.
		* getConstructor(constructorId): a function that is passed a constructorId and which return the constructor to call. By default it uses the constructorsMap.
		* constructorsMap: an hash of constructors referenced by their identifier
	*/
	options = lang.mixin({
		constructorIdProperty: "ConstructorId",
		getConstructorId: function(item){
			return item.declaredClass;
		},
		getConstructor: function(constructorId){
			return options.constructorsMap[constructorId];
		},
		constructorsMap: {},
	}, options);
	
	var createInstance = function(rawItem){
		var constructor = options.getConstructor(rawItem[options.constructorIdProperty]);
		delete rawItem[options.constructorIdProperty];
		return new constructor(rawItem);
	};
	
	return lang.delegate(store, {
		getConstructorId: options.getConstructorId,
		//constructorsMap: options.constructorsMap,
		query: function(query, directives){
			var rawResult = store.query(query, directives);
			var instancesResult = rawResult.map(function(rawItem){return createInstance(rawItem)});
			return QueryResults(instancesResult);
		},
		get: function(id, directives){
			var rawItem = store.get(id, directives);
			var instance = createInstance(rawItem);
			return instance;
		},
		add: function(object, directives){
			var constructorId = this.getConstructorId(object);
			object[options.constructorIdProperty] = constructorId;
			return store.put(object, directives);
		},
		put: function(object, directives){
			var constructorId = this.getConstructorId(object);
			object[options.constructorIdProperty] = constructorId;
			return store.put(object, directives);
		},
	});
};
return Constructor;
});
