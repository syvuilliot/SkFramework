define([], function(){

if (!Object.getOwnPropertyDescriptors) {
    Object.getOwnPropertyDescriptors = function (obj) {
        var descs = {};
        Object.getOwnPropertyNames(obj).forEach(function(propName) {
            descs[propName] = Object.getOwnPropertyDescriptor(obj, propName);
        });
        return descs;
    };
}

	Function.prototype.extend = function(subConstructor, subConstructorProps, subPrototypeProps){
		Object.getOwnPropertyNames(subConstructorProps).forEach(function(propName){
			subConstructor[propName] = subConstructorProps[propName];
		});
		subConstructor.__proto__ = this;
		subConstructor.super = this;
		subConstructor.prototype = Object.create(this.prototype, Object.getOwnPropertyDescriptors(subPrototypeProps));
		subConstructor.prototype.constructor = subConstructor;
		subConstructor.prototype.superConstructor = this;
		subConstructor.prototype.super = this.prototype;
		return subConstructor;
	};
	Function.prototype.getSuper = function(){
		return Object.getPrototypeOf(this);
	};
});

/* Aide mémoire

Person=function Person(params){this.name=params.name};
Person.prototype.describe= function(){return "My name is "+this.name};

Worker = function Worker(params){Object.getPrototypeOf(Worker).call(this, params);this.job=params.job};
Worker.__proto__=Person;
Worker.prototype=Object.create(Person.prototype);
Worker.prototype.describe=function(){var superReturn = Object.getPrototypeOf(Object.getPrototypeOf(this)).describe.call(this, arguments); return superReturn+" and my job is "+this.job}
Worker.prototype.constructor=Worker
*/