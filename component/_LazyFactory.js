define([
	'dojo/_base/declare',	'dojo/_base/lang',
	'collections/map'
], function(
	declare,				lang,
	Map
) {
	/*
	 * Mixin adding placement API for Component
	 */
	return declare([], {
		_getComponent: function(arg) {
			var cmp = this.inherited(arguments);
			if (!cmp && typeof arg === "string") {
				cmp = this._addComponent(arg);
			}
			return cmp;
		}
	});
});
