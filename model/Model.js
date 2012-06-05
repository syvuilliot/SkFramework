define([
	"dojo/_base/lang",
	"SkFramework/utils/create",
], function(lang, create){
	var Model = create(null, function Model(params){
			lang.mixin(this, params);
			if (!this.id){this.id = Math.random();}
		}, {
			validate: function(){return true;},
			save: function(){
				if (this.validate()){Model.store.put(this);}
			},
			delete: function(){
				return Model.store.remove(this.getIdentity());
			},
			getIdentity: function(){
				return Model.store.getIdentity(this);
			},
			getclassName: function(){
				return this.constructor.name;
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
			},
			add: function(propertyName, value){
				if (this["add"+propertyName]){
					//if a adder is defined
					this["add"+propertyName](value);
				} else {
					this[propertyName].push(value);
				}
			},
			remove: function(propertyName, value){
				if (this["remove"+propertyName]){
					//if a adder is defined
					this["remove"+propertyName](value);
				} else {
					//TODO
				}
			},
		}, {
			query: function(query, options){
				return Model.store.query(lang.mixin({}, {instanceof: this}, query), options);
				/*
				return Model.store.query(function(item){
					return item instanceof this;
				}.bind(this));
				*/
			},
			addRelationTo: function(targetModel, options){
				var relationDefinition = lang.mixin({
					sourceModel: this,
					targetModel: targetModel
				}, options);
				Model.addRelation(relationDefinition);
			},
		}
	);
	Model.addRelation = function(relation){
		//ajoute un getter sur la classe Model source
		if (!relation.sourceModel.prototype["get"+relation.sourcePropertyName]){
			relation.sourceModel.prototype["get"+relation.sourcePropertyName] = function(){
				var self = this;
				return Model.store.query(function(item){
					return item instanceof relation.targetModel && self[relation.sourcePropertyName] && self[relation.sourcePropertyName].indexOf(item.getIdentity())>= 0;
				});
			};
		}
		//ajoute un getter sur la classe Model cible
		if (!relation.targetModel.prototype["get"+relation.targetPropertyName]){
			relation.targetModel.prototype["get"+relation.targetPropertyName] = function(){
				var self = this;
				return Model.store.query(function(item){
					return item instanceof relation.sourceModel && item[relation.sourcePropertyName] && item[relation.sourcePropertyName].indexOf(self.getIdentity()) >= 0;
				});
			};
		}
		//ajoute un adder sur la classe Model source
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
	};
	
	return Model;
});