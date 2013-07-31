define([
	"bacon",
	"../utils/destroy",
], function(
	Bacon,
	destroy
){
	var Bindable = {
		// call set(prop) with value from observable at each notification
		setR: function(prop, observable){
			return this.own(observable.onValue(this, "set", prop));
		},
		// create a bidi value binding from source to this
		bind: function(targetProp, source, sourceProp){
			var init = true;
			var target = this;
			var sourceValueR = source.getR(sourceProp);
			var targetValueR = target.getR(targetProp);
			var changing = false;
			var sourceHandler = sourceValueR.onValue(function(value){
				if (! changing){
					changing = true;
					target.set(targetProp, value);
					changing = false;
				}
			});
			var targetHandler = targetValueR.onValue(function(value){
				if (! changing && ! init){ // prevent calling source.set at init time
					changing = true;
					source.set(sourceProp, value);
					changing = false;
				}
			});
			init = false;
			return this.own(function(){
				targetHandler();
				sourceHandler();
			});
		},

		// permet d'éxécuter une fonction lorsque la valeur de chaque propriété est définie (!== undefined) et à chaque fois que la valeur de l'une ou plusieurs d'entre elles change
		// afin de faciliter les choses, si la fonction retourne un canceler ou destroyable, celui-ci est exécutée/détruit à la prochaine itération (changement de l'une ou plusieurs des propriétés et même si une des valeurs est undefined)
		//
		// le dernier argument de when peut être une fonction ou un itérable de fonctions
		when: function(){
			var canceler;
			var args = Array.prototype.slice.call(arguments, 0, arguments.length-1).map(function(cmp){
				return this.getR(cmp);
			}.bind(this));
			var binder;
			var lastArg = arguments[arguments.length-1];
			if (typeof lastArg === 'function'){
				binder = lastArg;
			} else {
				binder = function(){
					return lastArg.map(function(cb) {
						return cb.apply(this, arguments);
					}.bind(this));
				};
			}

			args.push(function(){
				if (canceler){
					destroy(canceler);
					this.unown && this.unown(canceler);
					canceler = undefined;
				}
				if (Array.prototype.every.call(arguments, function(val){
					return val !== undefined;
				})) {
					canceler = binder.apply(this, arguments);
					this.own && this.own(canceler);
				}
			}.bind(this));
			return this.own(Bacon.onValues.apply(Bacon, args));
		},

		whenEach: function() {
			Array.prototype.forEach.call(arguments, function(args) {
				this.when.apply(this, args);
			}, this);
		},

		// deprecated
		bindValue: function(source, sourceProp, target, targetProp){
			return this.when(source, target, function(source, target){
				return target.setR(targetProp, source.getR(sourceProp));
			});
		},
		// deprecated
		syncValue: function(source, sourceProp, target, targetProp){
			return this.when(source, target, function(source, target){
				return target.bind(targetProp, source, sourceProp);
			});
		},
		bindEvent: function(source, eventType, target, targetMethod){
			return this.when(source, target, function(source, target){
				return source.on(eventType, function(ev){
					target[targetMethod](ev);
				});
			});
		},
	};
	return Bindable;
});