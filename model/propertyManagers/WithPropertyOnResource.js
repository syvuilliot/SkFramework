define([
	'collections/listen/property-changes',
], function(
	propChange
){
	// mixin for mirroring the value setted here on a property of the resource
	// and for setting a new value here when it is changed on the resource directly
	var WithPropertyValueBindedOnResource = function(args){
		var install = this.install;
		var uninstall = this.uninstall;
		var set = this.set;

		this.install = function(rsc, arg){
			install.call(this, rsc, arg);
			// store initial value of resource for this property
			this.set(rsc, rsc[args.name], true);
			// start observing value changes for this property on resource
			propChange.addOwnPropertyChangeListener(rsc, args.name, function(value){
				this.set(rsc, value, true);
			}.bind(this));
		};
		this.set = function(rsc, value, dontSyncOnRsc){
			set.call(this, rsc, value);
			value = this.get(rsc); // use getter
			if (!dontSyncOnRsc) {
				rsc[args.name] = value;
			}
		};
	};
	return WithPropertyValueBindedOnResource;
});