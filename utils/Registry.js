define([
	"collections/set",
	"SkFramework/utils/proxyFunctions",
], function(
	Set,
	proxy
) {
	/*
	* base class for ResourcesManager
	*/
	function ResourcesManager(){
		this._registry = new Set();
	}

	var proto = ResourcesManager.prototype;

	/*
	 * register a new resource
	 */
	proto.register = function(rsc) {
		this._registry.add(rsc);
	};

	/*
	 * unregister a resource
	 */
	proto.unregister = function(rsc) {
		this._registry.delete(rsc);
	};


	proto.has = function(rsc) {
		return this._registry.has(rsc);
	};

	proxy.prop(proto, "_registry", "length");
	proxy.method(proto, "_registry", "forEach");

	return ResourcesManager;

});
