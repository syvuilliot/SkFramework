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
		this.factory = args.factory;
	};

	Mixin.applyPrototype = function() {
		var baseGet = this.get;

		this.get = function(id) {
			var cmp = baseGet.call(this, id);
			if (!cmp) {
				cmp = this.factory.create(id);
				cmp && this.add(cmp, id);
			}
			if (cmp) {
				this._usersCount.set(cmp, (this._usersCount.get(cmp) || 0) + 1);
			}
			return cmp;
		};

		this.release = function(id) {
			var cmp = baseGet.call(this, id);
			if (!cmp) { return; }

			var count = (this._usersCount.get(cmp) || 0) - 1;
			if (count <= 0){
				this._usersCount.delete(cmp);
				this.factory.destroy(id, cmp);
				this.remove(cmp);
			} else {
				this._usersCount.set(cmp, count);
			}
		};
	};

	return Mixin;
});