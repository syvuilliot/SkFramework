﻿define([
	"dojo/_base/lang",
	"SkFramework/utils/create",
	"dojo/store/Memory",
	"SkFramework/store/SimpleQueryEngineGet",
], function(lang, create, Memory, SimpleQueryEngineGet){
	var Model = create(null, function Model(params){
			//use set to mix every property from params
			if(params){
				Object.keys(params).forEach(function(key){
					this.set(key, params[key]);
				}.bind(this));
			}
			//lang.mixin(this, params);
			if (!this.id) {
				this.set("id", this.constructor.generateId());
			}
		}, {
			validate: function(){return true;},
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
			getclassName: function(){
				return this.constructor.name;
			},
			getinstanceof: function(constructor){

			},
			get: function(propertyName){
				if (this["get"+propertyName]){
					//if a getter is defined
					return this["get"+propertyName]();
				} else {
					return this[propertyName];
				}
			},
			set: function(propertyName, value){
				if (this["set"+propertyName]){
					//if a setter is defined
					this["set"+propertyName](value);
				} else {
					this[propertyName]=value;
				}
				return this;
			},
			add: function(propertyName, value, options){
				if (this["add"+propertyName]){
					//if a adder is defined
					return this["add"+propertyName](value, options);
				} else {
					if(!this[propertyName]){this[propertyName]=[];}
					return this[propertyName].push(value);
				}
			},
			remove: function(propertyName, value){
				if (this["remove"+propertyName]){
					//if a adder is defined
					return this["remove"+propertyName](value);
				} else {
					var index = this[propertyName] && this[propertyName].indexOf(value);
					if(index >= 0){
						return this[propertyName].splice(index, 1);
					}
				}
			},
		}, {
			store: new Memory({queryEngine: SimpleQueryEngineGet}),
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
			extend: function(constructor, prototypeExtension, ClassExtension){
				return create(this, constructor, prototypeExtension, ClassExtension);
			},
		}
	);
	Model.addRelation = function(relation){
		//ajoute un getter sur la classe Model source
		if (!relation.sourceModel.prototype["get"+relation.sourcePropertyName]){
			relation.sourceModel.prototype["get"+relation.sourcePropertyName] = function(){
				//	var self = this;
				//	return relation.targetModel.store.query(function(item){
				//	return item instanceof relation.targetModel && self[relation.sourcePropertyName] && self[relation.sourcePropertyName].indexOf(item.getIdentity())>= 0;
				// });
				return relation.targetModel.store.get(this[relation.sourcePropertyName]);
			};
		}
		//ajoute un getter sur la classe Model cible
		if (!relation.targetModel.prototype["get"+relation.targetPropertyName]){
			relation.targetModel.prototype["get"+relation.targetPropertyName] = function(){
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
		if (!relation.sourceModel.prototype["set"+relation.sourcePropertyName]){
			relation.sourceModel.prototype["set"+relation.sourcePropertyName] = function(value){
				this[relation.sourcePropertyName] = value.getIdentity();
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
	
	return Model;
});