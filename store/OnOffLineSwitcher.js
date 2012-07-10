define(["dojo/_base/lang","dojo/_base/Deferred"
],function(lang, Deferred) {
var Switcher = function(onLineStore, offLineStore, options){
	var switcher = {};
	switcher.onLine = function(){
		//TODO: how to know if we are online ?
		return false;
	};
	var addMethod = function(method){
		switcher[method] = function(){
			if (this.onLine()){
				return onLineStore[method].apply(onLineStore, arguments);
			} else {
				return offLineStore[method].apply(offLineStore, arguments);
			}
		};
	};

	["get", "put", "remove", "add"].forEach(addMethod);

	lang.mixin(switcher, options);

	return switcher;
};
return Switcher;
});