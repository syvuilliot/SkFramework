define([
	"ksf/utils/constructor",
	"collections/map",
	"ksf/component/Registry",
], function(
	ctr,
	Map,
	Registry
){
	/**
	Registry of components that are created on demand on "get" and are destroyed (forgotten) if nobody use them
	*/
	return ctr(Registry, function(factory){
		this._usersCount = new Map();
		this._factory = factory;
	}, {
		get: function(id){
			var cmp = this._components.get(id) || this._factory.create(id);
			this._usersCount.set(cmp, (this._usersCount.get(cmp) || 0)+1);
			return cmp;
		},
		release: function(id){
			var cmp = this._components.get(id);
			var count = (this._usersCount.get(cmp) || 0)-1;
			if (count <=0){
				this._usersCount.delete(cmp);
				this._factory.destroy(id);
				this._components.delete(id);
			} else {
				this._usersCount.set(cmp, count);
			}
		},
	});


});