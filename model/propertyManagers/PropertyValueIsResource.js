define([

], function(

){
	// the value for this property is the resource directly
	// so, it is a read only property
	var PropertyValueIsResource = function(args){
	};
	PropertyValueIsResource.prototype = {
		install: function(rsc, arg){
			if (arguments.length === 2){
				this.set(rsc, arg);
			}
		},
		uninstall: function(rsc){
		},
		has: function(rsc){
			return true;
		},
		get: function(rsc){
			return rsc;
		},
		set: function(rsc, value){
		},
	};
	return PropertyValueIsResource;
});