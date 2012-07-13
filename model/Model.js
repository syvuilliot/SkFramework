define([
	"dojo/_base/lang",
	"SkFramework/utils/create",
	"dojo/Stateful",
	//"dojo/store/Memory",
	"SkFramework/store/PersistableMemory",
	"dojo/store/Observable",
	"SkFramework/store/SimpleQueryEngineGet",
	"dojox/json/schema",
], function(lang, create, Stateful, Memory, Observable, SimpleQueryEngineGet, jsonSchema){
	var Model = create(Stateful, function Model(params){
			//use set to mix every property from params
			Model.super.apply(this, arguments);
			if (!this.id) {
				this.set("id", this.constructor.generateId());
			}
		}, {
			"$schema": {type: "object", properties:{id: {type: "string"}}},
			validate: function(){
				//use JSON parsing to remove inherited properties from instance and from schema
				var validationResult = jsonSchema.validate(JSON.parse(JSON.stringify(this)), JSON.parse(JSON.stringify(this.$schema)));
				if (! validationResult.valid){console.log("Validation failed for ", this, validationResult);}
				return validationResult.valid;
			},
			save: function(){
				if (this.validate()){
					this.constructor.store.put(this);
				}
				return this;
			},
			delete: function(){
				return this.constructor.store.remove(this.getIdentity());
			},
			getIdentity: function(){
				return this.constructor.store.getIdentity(this);
			},
			add: function(propertyName, value, options){
				var adderName = "_"+propertyName+"Adder";
				if (this[adderName]){
					//if a adder is defined
					return this[adderName](value, options);
				} else {
					if(!this[propertyName]){this[propertyName]=[];}
					return this[propertyName].push(value);
				}
			},
			remove: function(propertyName, value){
				var removerName = "_"+propertyName+"Remover";
				if (this[removerName]){
					//if a adder is defined
					return this[removerName](value);
				} else {
					var index = this[propertyName] && this[propertyName].indexOf(value);
					if(index >= 0){
						return this[propertyName].splice(index, 1);
					}
				}
			},
		}, {
			initNewStore: function(){
				var constructorsMap = {};
				constructorsMap[this.name] = this;
				var store = Observable(new Memory({
					queryEngine: SimpleQueryEngineGet,
					storageKey: this.name + "Store",
					constructorsMap: constructorsMap,
				}));
				this.store = store;
				return store;
			},
			get: function(id){
				return this.store.get(id);
			},
			put: function(object, options){
				return this.store.put(object, options);
			},
			add: function(object, options){
				return this.store.add(object, options);
			},
			remove: function(id){
				return this.store.remove(id);
			},
			query: function(query, options){
				return this.store.query(lang.mixin({}, {instanceof: this}, query), options);
			},
			addRelationTo: function(targetModel, options){
				var relationDefinition = lang.mixin({
					sourceModel: this,
					targetModel: targetModel
				}, options);
				Model.addRelation(relationDefinition);
			},
			generateId: function() {
				return (Math.floor(Math.random() * 1000000)).toString();
			},
			extend: function(subConstructor, prototypeExtension, ClassExtension){
				var subModel = create(this, subConstructor, prototypeExtension, ClassExtension);
				//in case the store is a persistableMemory
				if (this.store.constructorsMap){
					this.store.constructorsMap[subModel.name] = subModel;
				}
				return subModel;
			},
			extendWithSchema: function(schema){
				if (schema.id){
					subModel = this.extend(schema.id);
				} else {
					subModel = this.extend();
				}
				schema["extends"] = this.prototype.$schema;
				subModel.prototype.$schema = schema;
				return subModel;
			},
		}
	);
	Model.addRelation = function(relation){
		//ajoute un getter sur la classe Model source
		var getterName = "_"+relation.sourcePropertyName+"Getter";
		if (!relation.sourceModel.prototype[getterName]){
			relation.sourceModel.prototype[getterName] = function(){
				//	var self = this;
				//	return relation.targetModel.store.query(function(item){
				//	return item instanceof relation.targetModel && self[relation.sourcePropertyName] && self[relation.sourcePropertyName].indexOf(item.getIdentity())>= 0;
				// });
				return this[relation.sourcePropertyName] && relation.targetModel.store.get(this[relation.sourcePropertyName]);
			};
		}
		//ajoute un getter sur la classe Model cible
		getterName = "_"+relation.targetPropertyName+"Getter";
		if (!relation.targetModel.prototype[getterName]){
			relation.targetModel.prototype[getterName] = function(){
				var targetInstance = this;
				// var result = relation.sourceModel.store.query(function(item){
				// 	return item instanceof relation.sourceModel && item[relation.sourcePropertyName] && item[relation.sourcePropertyName] === this.getIdentity();
				// }.bind(this));
				var query = {instanceof: relation.sourceModel};
				query[relation.sourcePropertyName] = this;
				var result = relation.sourceModel.store.query(query);
				result.add = result.put = function(sourceInstance){
					return sourceInstance.set(relation.sourcePropertyName, targetInstance);
				};
				return result;
			};
		}
		//ajoute un setter sur la classe Model source
		var setterName = "_"+relation.sourcePropertyName+"Setter";
		if (!relation.sourceModel.prototype[setterName]){
			relation.sourceModel.prototype[setterName] = function(value){
				this[relation.sourcePropertyName] = typeof value === "string" ? value : value.getIdentity();
			};
		}
/*		//ajoute un adder sur la classe Model source
		if (!relation.sourceModel.prototype["add"+relation.sourcePropertyName]){
			relation.sourceModel.prototype["add"+relation.sourcePropertyName] = function(value){
				if (!this[relation.sourcePropertyName]){this[relation.sourcePropertyName]=[];}
				this[relation.sourcePropertyName].push(value.getIdentity());
			};
		}
		//ajoute un adder sur la classe Model cible
		if (!relation.targetModel.prototype["add"+relation.targetPropertyName]){
			relation.targetModel.prototype["add"+relation.targetPropertyName] = function(value){
				value.add(relation.sourcePropertyName, this);
			};
		}
		//ajoute un remover sur la classe Model source
		if (!relation.sourceModel.prototype["remove"+relation.sourcePropertyName]){
			relation.sourceModel.prototype["remove"+relation.sourcePropertyName] = function(value){
				if (!this[relation.sourcePropertyName]){this[relation.sourcePropertyName]=[];}
				var idList = this[relation.sourcePropertyName];
				var index = idList.indexOf(value.getIdentity());
				if(index !== -1){idList.splice(index, 1);}
			};
		}
		//ajoute un remover sur la classe Model cible
		if (!relation.targetModel.prototype["remove"+relation.targetPropertyName]){
			relation.targetModel.prototype["remove"+relation.targetPropertyName] = function(value){
				value.remove(relation.sourcePropertyName, this);
			};
		}
*/	};
	
	Model.initNewStore();
	return Model;
});