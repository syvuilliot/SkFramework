define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"SkFramework/utils/statefulSync",
	"dojo/on",
	"dojo/dom-style",


], function(declare, lang, statefulSync, on, domStyle){

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
		constructor: function(source, target, params){
			this.handlers.push(source.watch(params.sourceProp, function(prop, old, current){
				this.update(source, target, params);
			}.bind(this)));
		},
		update: function(source, target, params){
			var value = source.get(params.sourceProp);
			var prop = params.targetProp;
			target.set ? target.set(prop, value) : target[prop] = value;
		},
	});

	binding.Stateful2InnerHtml = declare(binding.Value, {
		update: function(source, target, params){
			target.innerHTML = source.get(params.sourceProp);
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
			this.handlers.push(on(source, this.event, target[params.method].bind(target)));
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
		update: function(source, target, params){
			var queryResult = source[params.sourceProp];
			if (queryResult && queryResult.forEach) {
				//init
				queryResult.forEach(function(value){
					target[params.addMethod](value, value.id);//TODO: use getIdentity
				});
			}
			if (queryResult && queryResult.observe) {
				//observe
				this.handlers.push(queryResult.observe(function(item, from, to){
					if (to < 0){ //item removed
						target[params.removeMethod](item, item.id);//TODO: use getIdentity
					}
					if (from < 0){ //item added
						target[params.addMethod](item, item.id);//TODO: use getIdentity
					}
				}, true));
			}
		},
	});


	return binding;
});