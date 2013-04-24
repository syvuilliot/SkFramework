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
		Registry.apply(this, arguments);
		this._usersCount = new Map();
		this._factory = factory;
	}, {
		get: function(id){
			var cmp = this._components.getValues(id)[0];
			if (!cmp){
				cmp = this._factory.create(id);
				this.add(cmp, id);
			}
			if (cmp){
				this._usersCount.set(cmp, (this._usersCount.get(cmp) || 0)+1);
			}
			return cmp;
		},
		release: function(id){
			var cmp = this._components.getValues(id)[0];
			var count = (this._usersCount.get(cmp) || 0)-1;
			if (count <=0){
				this._usersCount.delete(cmp);
				this._factory.destroy(id);
				this.delete(cmp);
			} else {
				this._usersCount.set(cmp, count);
			}
		},
	});


});