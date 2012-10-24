define([
	'dojo/_base/declare',	'dojo/_base/lang',
	'dojo/Stateful',	'dojo/Evented',	'dijit/Destroyable'
], function(
	declare,				lang,
	Stateful,			Evented,		Destroyable
) {
	return declare([Stateful, Evented, Destroyable], {
		_presenter: null,
		_components: null,
		

		get: function() {
			return this._presenter.get.apply(this._presenter, arguments);
		},

		set: function(prop, value) {
			if (prop instanceof Object || prop in this) {
				return this.inherited(arguments);
			} else {
				return this._presenter.set(prop, value);
			}
		},
		

		/*
		 * Register sub-components
		 */
		_addComponents: function(components) {
			this._components = lang.mixin(this._components, components);
		},

	});
});
