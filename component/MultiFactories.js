define([
	"ksf/utils/constructor",
], function(
	ctr
){
	/**
	Implements the factory API
	Delegate to a collection of factories indexed by id
	*/
	return ctr(function(args){
		this.factories = args.factories;
	}, {
		create: function(id, args){
			return this.factories.get(id).create(args);
		},
		destroy: function(id, args){
			return this.factories.get(id).destroy(args);
		},
		createEach: function(ids, args) {
			if (typeof ids.forEach === "function") {
				ids.forEach(function(id) {
					this.create(id, args);
				}, this);
			}
		},
	});


});