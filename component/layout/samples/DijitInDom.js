define([
	'dojo/_base/declare'
], function(
	declare
) {
	var isDijit = function(elmt) {
		return elmt.domNode && elmt.startup && elmt.set;
	};
	var isDom = function(elmt) {
		return elmt instanceof HTMLElement;
	}

	return declare([], {
		put: function(child, parent, options) {
			if (isDom(parent) && isDijit(child)) {
				parent.appendChild(child.domNode);
				child.startup();
			}
		},
		set: function(child, parent, options) {
			if (isDom(parent) && isDijit(child)) {
				child.resize();
			}
		}
	});
});