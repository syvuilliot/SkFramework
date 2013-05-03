define([
	"ksf/utils/constructor",
	"collections/map",
	"ksf/utils/IndexedSet",
], function(
	ctr,
	Map,
	IndexedSet
){
	/**
	Registry of components that are created on demand on "get" and are destroyed (forgotten) if nobody use them
	*/
	return ctr(function(args){
		this._registry = args.registry || new IndexedSet();
		this._usersCount = new Map();
		this._factory = args.factory;
	}, {
		get: function(id){
			var cmp = this._registry.get(id);
			if (!cmp){
				cmp = this._factory.create(id);
				cmp && this._registry.add(cmp, id);
			}
			if (cmp){
				this._usersCount.set(cmp, (this._usersCount.get(cmp) || 0)+1);
			}
			return cmp;
		},
		release: function(id){
			var cmp = this._registry.get(id);
			if (!cmp) { return; }

			var count = (this._usersCount.get(cmp) || 0) - 1;
			if (count <= 0){
				this._usersCount.delete(cmp);
				this._factory.destroy(id, cmp);
				this._registry.remove(cmp);
			} else {
				this._usersCount.set(cmp, count);
			}
		},
	});


});