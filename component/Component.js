define([
	'lodash/lodash',
	'dojo/_base/declare',
	'dojo/Stateful',	'dojo/Evented',	'dijit/Destroyable'
], function(_,
	declare,
	Stateful,			Evented,		Destroyable
) {
	return declare([Stateful, Evented, Destroyable], {
		constructor: function(){
			this._presenter = null;
			this._components = {};
		},

		postscript: function(params) {
			this.inherited(arguments);
			this._bind();
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
		

		/*
		 * Register sub-components
		 */
		_addComponents: function(components) {
			Object.keys(components).forEach(function(id){
				this._addComponent(components[id], id);
			}.bind(this));
		},
		_addComponent: function(component, id){
			//TODO: generate an id if none is provided
			this._components[id] = component;
		},
		_getComponent: function(id){
			return this._components[id];
		},
		_removeComponent: function (id) {
			//TODO: remove component by reference and not (only) by id
			delete this._components[id];
		},
		
		/*
		 * Binding between Presenter and sub components
		 */
		_bind: function() {
		},

		destroy: function () {
			//unregister every component and call destroy on them if available
			_(this._components).forEach(function(component, id){
				this._removeComponent(id);
				component.destroy && component.destroy();
			}.bind(this));
			this.inherited(arguments);
		}
	});
});
