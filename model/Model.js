define([
	"dojo/_base/lang",
	"../utils/create",
	"dojo/Stateful",
	"dojo/store/Memory",
	"../store/ChainableQuery",
	"../store/PersistableMemory",
	"dojo/store/Observable",
	"../store/ObservableMap",
	"../store/SimpleQueryEngineGet",
	"dojox/json/schema"
], function(
	lang,
	create,
	Stateful,
	Memory,
	Chainable,
	Persistable,
	Observable,
	ObservableMap,
	SimpleQueryEngineGet,
	jsonSchema
){
	var jsonSchemaValidator = {
		dojox: function(){
			//use JSON parsing to remove inherited properties from instance and from schema
			var value = JSON.parse(JSON.stringify(this));
			var schema = this.$schema;
			var validationResult = jsonSchema.validate(value, schema);
			if (! validationResult.valid){console.warn("Validation failed for ", this, validationResult);}
			return validationResult.valid;
		},
/*		jsv: function(){
			var value = JSON.parse(JSON.stringify(this));
			var schema = this.$schema;
			var env = JSV.createEnvironment();
			var report = env.validate(value, schema);
			if (report.errors.length === 0){
				return true;
			} else {
				console.log("Validation failed for", this, report);
				return false;
			}
		}
*/	};


	var Model = create(Stateful, function Model(params){
			Model.super.apply(this, arguments);
			if (!this.id) {
				this.set("id", this.constructor.generateId());
			}
		}, {
			"$schema": {type: "object", properties:{id: {type: "string"}}},
			validate: jsonSchemaValidator.dojox,
			save: function(){
				if (this.validate()){
					this.constructor.store.put(this);
				}
				return this;
			},
			'delete': function(){
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
					//if a remover is defined
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
				var store = Chainable(Observable(Persistable(new Memory({
					queryEngine: SimpleQueryEngineGet,
				}), {
					storageKey: this.name + "Store",
					constructorsMap: constructorsMap,
					autoSave: true,
				})));
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
				var result = this.store.query(lang.mixin({}, {'instanceof': this}, query), options);
				result.observe && result.observe(function(){}); //start observing (prevent "out of date queryResult" error)
				return result;
			},
			save: function(){
				return this.store.save();
			},
			load: function(){
				return this.store.load();
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
				var subModel;
				if (schema.id){
					subModel = this.extend(schema.id);
				} else {
					subModel = this.extend();
				}
				subModel.setSchema(schema);
				return subModel;
			},
			setSchema: function(schema){
				var schemaCopy = lang.clone(schema);
				schemaCopy["extends"] = this.super.prototype.$schema;
				this.prototype.$schema = schemaCopy;
			},
		}
	);
	Model.addRelation = function(relation){
		// relation.sourceModel ("many" side in "one2many", ex: Todo)
		// relation.sourcePropertyName (ex: assignee)
		// relation.targetModel ("one" side in "one2many", ex: Person)
		// relation.targetPropertyName (ex: todos)

		//ajoute un getter sur la classe Model source
		var getterName = "_"+relation.sourcePropertyName+"Getter";
		if (!relation.sourceModel.prototype[getterName]){
			relation.sourceModel.prototype[getterName] = function(){
				return this[relation.sourcePropertyName] && relation.targetModel.store.get(this[relation.sourcePropertyName]);
			};
		}
		//ajoute un getter sur la classe Model cible
		getterName = "_"+relation.targetPropertyName+"Getter";
		if (!relation.targetModel.prototype[getterName]){
			relation.targetModel.prototype[getterName] = function(){
				var targetInstance = this;
				var query = {'instanceof': relation.sourceModel};
				query[relation.sourcePropertyName] = this;
				var result = relation.sourceModel.store.query(query);
				var originalPut = result.put;
				// any item added to this collection will have a relation to targetInstance
				// is that really necessary ?
				result.put = function(sourceInstance){
					if (sourceInstance.get(relation.sourcePropertyName) !== targetInstance){
						sourceInstance.set(relation.sourcePropertyName, targetInstance);
					}
					return originalPut.apply(result, arguments);
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

		// augment target class store remove method to delete also related items
		var targetStore = relation.targetModel.store;
		var originalRemove = targetStore.remove;
		targetStore.remove = function(id){
			var item = targetStore.get(id);
			if (item instanceof relation.targetModel){
				var relatedInstances = item.get(relation.targetPropertyName);
				relatedInstances.forEach(function(instance){
					instance.delete();
				});
			}
			originalRemove.apply(targetStore, arguments);
		};

	};

	Model.addMany2ManyRelation = function(relationDef){
		var IntermediaryModel = Model.extend();

		IntermediaryModel.addRelationTo(relationDef.targetModel, {
			sourcePropertyName: relationDef.sourceAddRemoveName,
			targetPropertyName: relationDef.targetGetName+"Relations",
		});
		IntermediaryModel.addRelationTo(Todo, {
			sourcePropertyName: relationDef.targetAddRemoveName,
			targetPropertyName: relationDef.sourceGetName+"Relations",
		});

		//add a getter on target Model
		relationDef.targetModel.prototype["_"+relationDef.targetGetName+"Getter"] = function(){
			var relations = this.get(relationDef.targetGetName+"Relations");
			var sourceInstances = Chainable(Observable(new Memory()));
			relations.forEach(function(relation){
				sourceInstances.put(relation.get(relationDef.targetAddRemoveName));
			});
			relations.observe(function(relation, from, to){
				if (to < 0) {
					sourceInstances.remove(relation.get(relationDef.targetAddRemoveName).getIdentity());
				}
				if (from < 0) {
					sourceInstances.put(relation.get(relationDef.targetAddRemoveName));
				}
			});
			return sourceInstances.query();
		};

		//add an adder on target model
		relationDef.targetModel.prototype["_"+relationDef.targetAddRemoveName+"Adder"] = function(sourceInstance, options){
			if(this.get(relationDef.targetGetName).get(sourceInstance.getIdentity()) === undefined) {
				options = options || {};
				options[relationDef.sourceAddRemoveName] = this;
				options[relationDef.targetAddRemoveName] = sourceInstance;
				return new IntermediaryModel(options).save();
			}
		};
		relationDef.targetModel.prototype["_"+relationDef.targetAddRemoveName+"Remover"] = function(sourceInstance){
			var queryObject = {};
			queryObject[relationDef.sourceAddRemoveName] = this;
			queryObject[relationDef.targetAddRemoveName] = sourceInstance;
			IntermediaryModel.query(queryObject).forEach(function(intermediaryInstance){
				intermediaryInstance.delete();
			});
		};



		relationDef.sourceModel.prototype["_"+relationDef.sourceGetName+"Getter"] = function(){
			var relations = this.get(relationDef.sourceGetName+"Relations");
			var targetInstances = Chainable(Observable(new Memory()));
			relations.forEach(function(relation){
				targetInstances.put(relation.get(relationDef.sourceAddRemoveName));
			});
			relations.observe(function(rel, from, to){
				if (to < 0) {
					targetInstances.remove(rel.get(relationDef.sourceAddRemoveName).getIdentity());
				}
				if (from < 0) {
					targetInstances.put(rel.get(relationDef.sourceAddRemoveName));
				}
			});
			return targetInstances.query();
		};
		relationDef.sourceModel.prototype["_"+relationDef.sourceAddRemoveName+"Adder"] = function(targetInstance, options){
			//in this case, where the intermediary model is transparent, we don't want to have many relations between one todo and one tag => a tag can only be set once on a todo
			if(this.get(relationDef.sourceGetName).get(targetInstance.getIdentity()) === undefined) {
				options = options || {};
				options[relationDef.targetAddRemoveName] = this;
				options[relationDef.sourceAddRemoveName] = targetInstance;
				return new IntermediaryModel(options).save();
			}
		};
		relationDef.sourceModel.prototype["_"+relationDef.sourceAddRemoveName+"Remover"] = function(targetInstance){
			var queryObject = {};
			queryObject[relationDef.targetAddRemoveName] = this;
			queryObject[relationDef.sourceAddRemoveName] = targetInstance;
			IntermediaryModel.query(queryObject).forEach(function(intermediaryInstance){
				intermediaryInstance.delete();
			});
		};

		var oldDelete = relationDef.sourceModel.prototype.delete;
		relationDef.sourceModel.prototype.delete = function(){
			//it should only exist one relation but we never know...
			this.get(relationDef.sourceGetName+"Relations").forEach(function(relation){
				relation.delete();
			});
			oldDelete.apply(this, arguments);
		};

		oldDelete = relationDef.targetModel.prototype.delete;
		relationDef.targetModel.prototype.delete = function(){
			this.get(relationDef.targetGetName+"Relations").forEach(function(relation){
				relation.delete();
			});
			oldDelete.apply(this, arguments);
		};

		return IntermediaryModel;
	};

	Model.initNewStore();
	return Model;
});