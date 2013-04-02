define([
	'./mixinProperties'
], function(
	mixin
) {
	var constructor = function(base, init, proto) {
		var Constructor = function(){
			base.apply(this, arguments);
			init.apply(this, arguments);
		};
		Constructor.prototype = Object.create(base.prototype);
		mixin(Constructor.prototype, init.prototype, proto);
		// Constructor.displayName = "toto";
		Constructor.extends = function(init, proto){
			return constructor(Constructor, init, proto);
		};
		return Constructor;
	};
	return constructor;
});