define([
	'collections/set',
], function(
	Set
){
	var Manager = function(args){
		this.resources = new Set();
		this.propertyManagers = {};
		this._factory = args.factory;
	};
	Manager.prototype = {
		create: function(args){
			// create instance
			var rsc = this._factory.create(args);
			// add properties
			Object.keys(this.propertyManagers).forEach(function(propName){
				var propMng = this.propertyManagers[propName];
				if (args && args.hasOwnProperty(propName)){
					propMng.install(rsc, args[propName]);
				} else {
					propMng.install(rsc);
				}
			}.bind(this));
			// register resource
			this.add(rsc);
			return rsc;
		},
		destroy: function(rsc){
			this.remove(rsc);
			Object.keys(this.propertyManagers).forEach(function(propName){
				var propMng = this.propertyManagers[propName];
				propMng.uninstall(rsc);
			}.bind(this));
			rsc.destroy && rsc.destroy();
		},
		add: function(rsc){
			return this.resources.add(rsc);
		},
		remove: function(rsc){
			return this.resources.delete(rsc);
		},
		has: function(rsc){
			return this.resources.has(rsc);
		},
		getPropValue: function(rsc, propName){
			return this.propertyManagers[propName].get(rsc);
		},
		setPropValue: function(rsc, propName, value){
			return this.propertyManagers[propName].set(rsc, value);
		},
		getBy: function(prop, value){
			return this.propertyManagers[prop].getBy(value);
		},
/*		// variant of setPropValue that do not set a new value but only change content of the current value
		addToPropValue: function(rsc, propName, item){
			return this.propertyManagers[propName].add(rsc, item);
		},
		// variant of setPropValue that do not set a new value but only change content of the current value
		removeFromPropValue: function(rsc, propName, item){
			return this.propertyManagers[propName].remove(rsc, item);
		},
*/	};

	return Manager;
});