define([
	'collections/map'
], function(
	Map
) {
	/**
	 * Registry of components that are created on demand on "get" and are destroyed (forgotten) if nobody use them
	 */
	var Mixin = function(args) {
		this._usersCount = new Map();
		this._factory = args.factory;
	};

	Mixin.applyPrototype = function() {
		var baseGet = this.get.bind(this);

		this.get = function(id) {
			var cmp = baseGet(id);
			if (!cmp) {
				cmp = this._factory.create(id);
				cmp && this.add(cmp, id);
			}
			if (cmp) {
				this._usersCount.set(cmp, (this._usersCount.get(cmp) || 0) + 1);
			}
			return cmp;
		};

		this.release = function(id) {
			var cmp = baseGet(id);
			if (!cmp) { return; }

			var count = (this._usersCount.get(cmp) || 0) - 1;
			if (count <= 0){
				this._usersCount.delete(cmp);
				this._factory.destroy(id, cmp);
				this.remove(cmp);
			} else {
				this._usersCount.set(cmp, count);
			}
		};
	};

	return Mixin;
});