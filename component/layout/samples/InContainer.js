define([
	'dojo/_base/declare'
], function(
	declare
) {
	var isContainer = function(elmt) {
		return elmt.root instanceof HTMLElement;
	}

	return declare([], {
		put: function(child, parent, options) {
			if (isContainer(parent)) {
				return parent.put(child, options);
			}
		},
		set: function(child, parent, options) {
			if (isContainer(parent)) {
				return parent.set(child, options);
			}
		}
	});
});