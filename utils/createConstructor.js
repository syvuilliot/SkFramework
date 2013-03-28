define([
	'./mixinProperties'
], function(
	mixin
) {
	return function(ctor, proto) {
		if (typeof ctor !== "function") {
			proto = ctor;
			ctor = function() {};
		}
		mixin(ctor.prototype, proto);
		return ctor;
	};
});