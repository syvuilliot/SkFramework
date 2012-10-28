define([
	'lodash/lodash',
	'dojo/_base/declare',	'dojo/_base/lang',
	'dojo/Stateful',	'dojo/Evented',	'dijit/Destroyable'
], function(_,
	declare,				lang,
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
			//TODO: return this.get if prop in this... no ?
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
		 * Build a component from a configuration object
		 * 
		 * configObject: can be one of the following:
		 * 	- Class of component
		 *  - {
		 * 		constructor: Class,
		 * 		classOption1: ...,
		 * 		classOption2: ...,
		 * 		...
		 *    }
		 * 	- instance of component (return as is)
		 */
		_buildComponent: function(configObject, options) {
			if (configObject instanceof Function) {
				// configObject is a class
				return new configObject(options);
			}
			if (_.isPlainObject(configObject)) {
				var configOptions = lang.mixin({}, configObject);
				delete configOptions.constructor;
				
				return new configObject.constructor(lang.mixin(configOptions, options));
			}
			else {
				// configObject is an instance
				return configObject;
			}
		},

		/*
		 * Register sub-components
		 */
		_addComponent: function(component, id){
			//TODO: generate an id if none is provided
			this._components[id] = component;
			return component;
		},
		
		/*
		 * Add several components at once
		 * 
		 *  - components: {
		 * 		id1: configObject1,
		 * 		id2: configObject2,
		 * 		...
		 * 	  }
		 */
		_addComponents: function(components) {
			Object.keys(components).forEach(function(id){
				this._addComponent(this._buildComponent(components[id]), id);
			}.bind(this));
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
