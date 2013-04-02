define([
	'./mixinProperties'
], function(
	mixin
) {
	var constructor = function(base, init, proto) {
		var Constructor;
		switch (arguments.length){
			case 3:
				Constructor = function(){
					base.apply(this, arguments);
					init.apply(this, arguments);
				};
				Constructor.prototype = Object.create(base.prototype);
				mixin(Constructor.prototype, init.prototype, proto);
				// Constructor.displayName = "toto";
				break;
			case 2:
				Constructor = base;
				proto = init;
				mixin(Constructor.prototype, proto);
				break;
			case 1:
				Constructor = function(){};
				proto = base;
				mixin(Constructor.prototype, proto);
		}
		// optional
		Constructor.extends = function(init, proto){
			return constructor(Constructor, init, proto);
		};
		return Constructor;
	};
	return constructor;
});