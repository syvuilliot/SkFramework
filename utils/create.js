define([], function(){
	/*
	if (!Object.getOwnPropertyDescriptors) {
		Object.getOwnPropertyDescriptors = function (obj) {
			var descs = {};
			Object.getOwnPropertyNames(obj).forEach(function(propName) {
				descs[propName] = Object.getOwnPropertyDescriptor(obj, propName);
			});
			return descs;
		};
	}
	*/
	var copyOwnFrom = function(target, source) {
        Object.getOwnPropertyNames(source).forEach(function(propName) {
            Object.defineProperty(target, propName,
                Object.getOwnPropertyDescriptor(source, propName));
        });
        return target;
    };
	
	var create = function(baseConstructor, subConstructor, subPrototypeProps, subConstructorProps){
		
		//create an empty baseConstructor if none provided
		if (!baseConstructor){baseConstructor = function BaseClass(){}};
		
		//default subConstructor if none is provided
		if(!subConstructor){subConstructor = function SubClass(){
			this.superConstructor.apply(this, arguments)		
		}};
		//make subConstructor inherite from baseConstructor
		if (subConstructor.__proto__){ //no standard way to do this so we need to ensure that __proto__ exists
			subConstructor.__proto__ = baseConstructor; 
		} else {
			throw "Sk/create cannot be used in this environnement because __proto__ is not provided";
		}
		
		//copy subConstructorProps own properties (class properties) onto subConstructor
		if(subConstructorProps){copyOwnFrom(subConstructor, subConstructorProps);}
		
		//store old prototype for later use
		var subConstructorOldPrototype = subConstructor.prototype;
		//make subConstructor.prototype inherite from baseConstructor.prototype
		subConstructor.prototype = Object.create(baseConstructor.prototype);
		//restore properties that were on old prototype (at least the contructor property)
		copyOwnFrom(subConstructor.prototype, subConstructorOldPrototype);
		//add the own properties from subPrototypeProps
		if(subPrototypeProps){copyOwnFrom(subConstructor.prototype, subPrototypeProps);}
		
		//add sugars for super calls (statics properties)
		subConstructor.super = baseConstructor;
		subConstructor.prototype.superConstructor = baseConstructor;
		subConstructor.prototype.super = baseConstructor.prototype;
		
		return subConstructor;
	};
	
	return create;
});