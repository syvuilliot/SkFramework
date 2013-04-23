define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"./statefulSync",
	"dojo/on",
	"dojo/dom-style",
	"frb/bind",
	"./constructor",
], function(declare, lang, statefulSync, on, domStyle, bind, ctr){

	var binding = {};

	var Binding = binding.Binding = declare(null, {
		constructor: function(source, target, params){
			this.handlers = [];
			this.source = source;
			this.target = target;
			if(params){
				this.params = params;
				lang.mixin(this, params);
			}
			this.init(source, target, params);
		},
		init: function(source, target, params){
			//to be overridden
			//call update by default but we could have a different logic at init time than at update time
			this.update(source, target, params);
		},
		update: function(source, target, params){ //does nothing by default
		},
		remove: function(){
			this.handlers.forEach(function(handler){
				handler.remove();
			});
		},
	});

	binding.Multi = declare(Binding, {
		constructor: function(source, target, params){
			params.forEach(function(bindingParams){
				var bindingType = bindingParams.type;
				delete bindingParams.type;
				this.handlers.push(new binding[bindingType](source, target, bindingParams));
			}.bind(this));
		}
	});

	binding.Value = declare(Binding, {
		constructor: function(source, target, params) {
			this.handlers.push(source.watch(params.sourceProp, function(prop, old, current){
				this.update(old, this.source.get(this.sourceProp));
			}.bind(this)));
		},
		init: function() {
			this.update(undefined, this.source.get(this.sourceProp));
		},
		update: function(oldValue, currentValue){
			var prop = this.targetProp;
			this.target.set ? this.target.set(prop, currentValue) : this.target[prop] = currentValue;
		}
	});

	binding.Stateful2InnerHtml = declare(binding.Value, {
		update: function(old, current){
			this.target.innerHTML = this.source.get(this.sourceProp);
		},
	});


	binding.ValueSync = declare(Binding, {
		constructor: function(source, target, params){
			var mapping = {};
			mapping[params.sourceProp] = params.targetProp;
			this.handlers.push(statefulSync(source, target, mapping));
		}
	});

	binding.Event = declare(Binding, {
		constructor: function(source, target, params){
			var callback = (params.method instanceof Function) ? params.method : target[params.method];
			this.handlers.push(on(source, this.event, callback.bind(target)));
		}
	});

	binding.ValueEvent = declare(Binding, {
		constructor: function(source, target, params){
			// signals current state
			params.method.bind(target)(source.get(params.sourceProp));
			// watch changes
			this.handlers.push(source.watch(params.sourceProp, function(prop, old, current){
				params.method.bind(target)(current);
			}.bind(this)));
		}
	});

	binding.Click = declare(binding.Event, {
		event: "click",
	});

	binding.Display = declare(Binding, {
		constructor: function(source, target, params){
			this.handlers.push(source.watch(params.sourceProp, function(prop, old, current){
				this.update(source, target, params);
			}.bind(this)));
		},
		update: function(source, target, params){
			var sourcePropValue = source.get(params.sourceProp); //we don't rely on current
			domStyle.set(target.domNode, "display", (params.not ? !sourcePropValue : sourcePropValue) ? "block" : "none");
		},
	});

	binding.ObservableQueryResult= declare(binding.Value, {
		init: function() {
			this._observeHandlers = [];
			this.inherited(arguments);
		},
		update: function(old, current) {
			this._unbindObserve();

			this.initMethod && this.target[this.initMethod](old, current);
			if (current && current.forEach) {
				//init
				current.forEach(function(value) {
					this.target[this.addMethod](value, value.id);//TODO: use getIdentity
				}.bind(this));
			}
			if (current && current.observe) {
				//observe
				this._observeHandlers.push(current.observe(function(item, from, to) {
					if (to < 0){ //item removed
						this.target[this.removeMethod](item, item.id);//TODO: use getIdentity
					}
					if (from < 0){ //item added
						this.target[this.addMethod](item, item.id);//TODO: use getIdentity
					}
				}.bind(this), true));
			}
		},
		_unbindObserve: function() {
			this._observeHandlers.forEach(function(handler){
				handler.remove();
			});
		},
		remove: function() {
			this.inherited(arguments);
			this._unbindObserve();
		}
	});


	var Mapper = ctr(function Mapper(args){
		// all properties are non enumerable (like on an array object) so they are not considered as items contained in this by frb
		Object.defineProperties(this, {
			// keep values to give them back to "remove" method and to allow forEach to work correctly when source is switched
			_rows: {value: []},
			_target: {value: args.target},
			_addMethod: {value: args.target[args.addMethod || "add"]},
			_removeMethod: {value: args.target[args.removeMethod || "remove"]},
		});
	}, {
		swap: function(position, removed, added){
			// console.log("swap called", arguments);
			var rows = this._rows;
			rows.splice(position, removed).forEach(function(row){
				this._removeMethod.call(this._target, row.value, position, row);
			}, this);
			added.forEach(function(value, index){
				var row = {
					value: value,
					get index(){return rows.indexOf(this);},
				};
				rows.splice(position+index, 0, row);
				this._addMethod.call(this._target, value, position+index, row);
			}, this);
		},
		// I don't know why this function is called but it is mandatory
		clear: function(){
			// console.log("clear called", arguments);
		},
		// frb need a way to know how many values are contained in this in order to remove them when a new collection is setted
		// it uses Array.from which delegate to array.addEach which uses "forEach" if available
		forEach: function () {
			return this._rows.forEach.apply(this._rows, arguments);
		},
	});

	// call methods "add(value, index)" and "remove(value, index)" of target based on observation of "source" collection
	binding.ReactiveMapping = declare(Binding, {
		constructor: function(source, target, params){
			this.handlers.push({
				remove: bind(new Mapper({
					target: target,
					addMethod: params && params.addMethod,
					removeMethod: params && params.removeMethod,
				}), "rangeContent()" , {"<-": params && params.sourceProp || "$", source: source}),
			});
		},
	});

	// take an array as collection in source[sourceProp] and an array as selection in target[targetProp] and maintain selection so that it never contains elements not contained in the collection
	binding.Selection = declare(Binding, {
		constructor: function(source, target, params){
			this.handlers.push(new binding.ReactiveMapping(source, {
				add: function(collectionItem, index){},
				remove: function(collectionItem, index){
					var selection = params && params.targetProp ? target[params.targetProp]: target;
					if (selection.has(collectionItem)){
						selection.delete(collectionItem);
					}
				},
			}, {
				sourceProp: params && params.sourceProp || "$",
			}));
			this.handlers.push(new binding.ReactiveMapping(target, {
				add: function(selectionItem, index){
					var collection = params && params.sourceProp ? source[params.sourceProp]: source;
					var selection = params && params.targetProp ? target[params.targetProp]: target;
					if (! collection.has(selectionItem)){
						selection.delete(selectionItem);
					}
				},
				remove: function(selectionItem, index){
				},
			}, {
				sourceProp: params && params.targetProp || "$",
			}));
		},
	});


	return binding;
});