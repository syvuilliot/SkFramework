define([
	'dojo/_base/declare',
	'dojo/Stateful',	'dijit/Destroyable'
], function(
	declare,
	Stateful,			Destroyable
) {
	return declare([Stateful, Destroyable], {
		_presenter: null,
		view: null,
		
		postscript: function(params) {
			this.inherited(arguments);
			this.bind();
		},
		
		destroy: function(){
			this.inherited(arguments);
			this.view.destroy();
		},

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
		
		bind: function() {
			// Binding between Presenter & View
		}
	});
});
