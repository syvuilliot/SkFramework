define([
	'SkFramework/utils/wru-amd',
	'../ResourcesManager',
], function(
	wru,
	ResourcesManager
) {
	var setup = function(tmp){
		tmp.rscManager = new ResourcesManager();
		tmp.rsc1 = {name: "toto"};
	};

	wru.test([{
		name: "Registering",
		test: function(tmp){
			tmp.rscManager.register(tmp.rsc1);
			wru.assert(tmp.rscManager.has(tmp.rsc1));
		},
		setup: setup,
	}, {
		name: "Unregistering",
		test: function(tmp){
			tmp.rscManager.register(tmp.rsc1);
			tmp.rscManager.unregister(tmp.rsc1);
			wru.assert(!tmp.rscManager.has(tmp.rsc1));
		},
		setup: setup,
	}]);

});