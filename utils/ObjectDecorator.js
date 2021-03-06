/*
 * Decorator for object with get/set methods
 *
 * Add/Override properties and methods to an object without modifying it
 */
define([
	'dojo/_base/lang'
], function(
	lang
) {
	/*
	 * Object decorator function
	 *
	 * @param {Object} obj
	 * @param {Object} props
	 * 		Attributes and methods
	 */
	return function(obj, props) {
		return lang.delegate(obj, lang.mixin({
			set: function(prop) {
				if (this.hasOwnProperty(prop)) {
					return obj.set.apply(this, arguments);
				} else {
					return obj.set.apply(obj, arguments);
				}
			}
		}, props));
	};
});