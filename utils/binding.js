define([
	'require',
	"dojo/_base/declare",
	"dojo/_base/lang",
], function(require, declare, lang){

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
			target.set(params.targetProp, source.get(params.sourceProp)); 
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
			var statefulSync = require("SkFramework/utils/statefulSync");
			this.handlers.push(statefulSync(source, target, mapping));
		}
	});

	binding.Event = declare(Binding, {
		constructor: function(source, target, params){
			var on = require("dojo/on");
			this.handlers.push(on(source, this.event, target[params.method].bind(target)));
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
			var domStyle = require("dojo/dom-style");
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