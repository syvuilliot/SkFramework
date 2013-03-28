define([
	'dojo/_base/lang'
], function(
	lang
) {
	return function(ctor, proto) {
		if (!lang.isFunction(ctor)) {
			proto = ctor;
			ctor = function() {}
		}
		lang.mixin(ctor.prototype, proto);
		return ctor;
	};
});