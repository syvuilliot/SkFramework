define([
], function(
) {
	'use strict';
	var fn = function() {
		var args = Array.prototype.slice.call(arguments);
		return function() {
			return args[0].apply(window, args.slice(1));
		};
	};
	
	fn.new_ = function() {
		var args = arguments;
		return function() {
			return new (Function.prototype.bind.apply(args[0], args));
		}
	};
	return fn;
});
