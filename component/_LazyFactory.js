define([
	'./Manager'
], function(
	Manager
) {
	return {
		get: function(arg) {
			var cmp = Manager.prototype.get.apply(this, arguments);
			if (!cmp && typeof arg === "string") {
				cmp = this.create(arg);
			}
			return cmp;
		}
	};
});
