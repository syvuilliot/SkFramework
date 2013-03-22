define([
	'dojo/_base/declare'
], function(
	declare
) {
	/*
	 * Mixin template that shows how to add implementation for placing in components mixed with _Placing
	 */
	var isSupportedChild = function(component) {
		return true;
	};
	
	var isSupportedContainer = function(component) {
		return true;
	};
	
	return declare([], {
		place: function(component, container, options) {
			if (isSupportedChild(component) && isSupportedContainer(container)) {
				// do the actual work here
				return true;
			}
			return false;
		},
		
		unplace: function (component, container) {
			if (isSupportedChild(component) && isSupportedContainer(container)) {
				// do the actual work here
				return true;
			}
			return false;
		}
	});
});
