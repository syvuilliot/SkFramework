define([
	'dojo/_base/declare'
], function(
	declare
) {
	var isDijit = function(elmt) {
		return elmt.domNode && elmt.startup && elmt.set;
	};
	var isDijitLayout = function(elmt) {
		return elmt.addChild && elmt.startup;
	};

	return declare([], {
		put: function(child, parent, options) {
			if (isDijitLayout(parent)) {
				if (isDijit(child)) {
					this.set(child, parent, options);
					parent.addChild(child);
					return true;
				}
			}
		},

		set: function(child, parent, options) {
			if (isDijitLayout(parent)) {
				if (isDijit(child)) {
					child.set(options);
				}
			}
		},

		remove: function(child, parent) {
			if (isDijitLayout(parent)) {
				if (isDijit(child)) {
					parent.removeChild(child);
				}
			}
		}
	});
});