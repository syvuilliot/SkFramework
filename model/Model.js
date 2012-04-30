define([
	"dojo/_base/lang",
	"dojo/_base/declare",
], function(lang, declare){
	var Model = declare("Sk.Model", [], {
		constructor: function(params){
			lang.mixin(this, params);
		},
		validate: function(){return true},
		save: function(){
			if (this.validate()){Model.store.put(this)}
		},
		getIdentity: function(){
			return Model.store.getIdentity(this);
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
	});
	Model.addRelation = function(relation){
		//ajoute un getter sur la classe Model source
		if (!relation.sourceModel.prototype["get"+relation.sourcePropertyName]){
			relation.sourceModel.prototype["get"+relation.sourcePropertyName] = function(){	
				var self = this;
				return Model.store.query(function(item){
					return item.isInstanceOf(relation.targetModel) && self[relation.sourcePropertyName] && self[relation.sourcePropertyName].indexOf(item.getIdentity())>= 0;
				});
			};
		}
		//ajoute un getter sur la classe Model cible
		if (!relation.targetModel.prototype["get"+relation.targetPropertyName]){
			relation.targetModel.prototype["get"+relation.targetPropertyName] = function(){
				var self = this;
				return Model.store.query(function(item){
					return item.isInstanceOf(relation.sourceModel) && item[relation.sourcePropertyName] && item[relation.sourcePropertyName].indexOf(self.getIdentity()) >= 0;
				});
			}
		}
		//ajoute un adder sur la classe Model source
		if (!relation.sourceModel.prototype["add"+relation.sourcePropertyName]){
			relation.sourceModel.prototype["add"+relation.sourcePropertyName] = function(value){
				if (!this[relation.sourcePropertyName]){this[relation.sourcePropertyName]=[]}
				this[relation.sourcePropertyName].push(value.getIdentity());
			};
		}
		//ajoute un adder sur la classe Model cible
		if (!relation.targetModel.prototype["add"+relation.targetPropertyName]){
			relation.targetModel.prototype["add"+relation.targetPropertyName] = function(value){
				value.add(relation.sourcePropertyName, this);
			}
		}
	};
	return Model;
});