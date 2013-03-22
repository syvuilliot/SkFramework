/*
 * Decorator for object with get/set methods
 *
 * Add/Override properties and methods to an object without modifying it
 */
define([
], function(
) {
	// redirect property access from proxy object to target object
	// ex: to access propety "fullName" of object accessible at "myProxy.target" on property "name" of object "myProxy", write:
	// proxyProperty(myProxy, "target", "name", "fullName");
	function proxyProperty(proxy, target, prop, targetProp){
		Object.defineProperty(proxy, prop, {
			get: function(){
				return this[target][targetProp || prop]; // use the same property name by default
			},
			set: function(value){
				this[target][targetProp || prop] = value;
			},
			enumerable: true,
			configurable: true,
		});
	}
	function proxyMethod (proxy, target, prop, targetProp){
		Object.defineProperty(proxy, prop, {
			value: function(){
				return this[target][targetProp || prop].apply(this[target], arguments);
			},
			enumerable: true,
			configurable: true,
		});
	}
	function proxyProperties (proxy, target, props){
		if (Array.isArray(props)){
			props.forEach(function(prop){
				proxyProperty(proxy, target, prop, props[prop]);
			});
		} else {
			Object.keys(props).forEach(function(prop){
				proxyProperty(proxy, target, prop, props[prop]);
			});
		}
	}
	function proxyMethods (proxy, target, props){
		if (Array.isArray(props)){
			props.forEach(function(prop){
				proxyMethod(proxy, target, prop);
			});
		} else {
			Object.keys(props).forEach(function(prop){
				proxyMethod(proxy, target, prop, props[prop]);
			});
		}
	}

	return {
		prop: proxyProperty,
		method: proxyMethod,
		props: proxyProperties,
		methods: proxyMethods,
	};
});