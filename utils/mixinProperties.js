define([], function(){

	/**
	Utility function that define properties on "target", by copying all (enumerable or not) own properties from "sources" from left to right.
	If the value of a "source" property, looks like a property descriptor, the property itself is not copied but the property descriptor it defines is used to configure a property on target.

	*/

	// define properties on target based on sources objects by copying eitheir the properties directly or by using their value as a property descriptor if it is considered as one
	function isDescriptor(value){
		if (typeof value !== "object" || value === null){
			return false;
		}
		// force value to be considered as a descriptor
		if (value._isDescriptor === true) {
			return true;
		}
		// if one key of value (own or inherited) is not a descriptor attribute, it is considered not to be a descriptor
		// in other words, a descriptor value must only have keys that form a descriptor and nothing else
		return Object.keys(value).every(function(key){
			return ["value", "writable", "enumerable", "get", "set", "configurable"].indexOf(key) !== -1;
		});
	}

	return function (target) {
		var sources = [].slice.call(arguments, 1);
		sources.forEach(function (source) {
			Object.getOwnPropertyNames(source).forEach(function(propName) {
				var descriptor = isDescriptor(source[propName]) ? source[propName] : Object.getOwnPropertyDescriptor(source, propName);
				Object.defineProperty(target, propName, descriptor);
			});
		});
		return target;
	};
});