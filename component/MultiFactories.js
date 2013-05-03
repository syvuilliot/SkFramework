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
			var factory = this.factories.get(id);
			if (!factory) return;
			
			return (typeof factory === "function") ? factory(args) : factory.create(args);
		},
		destroy: function(id, args){
			var factory = this.factories.get(id);
			return (factory.destroy) ? factory.destroy(args) : undefined;
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