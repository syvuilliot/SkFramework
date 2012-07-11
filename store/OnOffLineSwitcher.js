define(["dojo/_base/lang","dojo/_base/Deferred"
],function(lang, Deferred) {
var Switcher = function(onLineStore, offLineStore, options){
	//why to delegate to onLineStore more than to offLineStore ? what could be better ?
	var switcher = lang.delegate(onLineStore, {
		onLine: function(){
			return navigator.onLine;
		},
	});

	var addMethod = function(method){
		switcher[method] = function(){
			if (this.onLine()){
				return onLineStore[method].apply(onLineStore, arguments);
			} else {
				return offLineStore[method].apply(offLineStore, arguments);
			}
		};
	};

	["get", "put", "remove", "add", "query"].forEach(addMethod);

	lang.mixin(switcher, options);

	return switcher;
};
return Switcher;
});