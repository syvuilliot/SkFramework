define([
	'./mixinProperties'
], function(
	mixin
) {
	return function(ctor, proto) {
		if (typeof ctro !== "function") {
			proto = ctor;
			ctor = function() {};
		}
		mixin(ctor.prototype, proto);
		return ctor;
	};
});