define([
	'dojo/_base/lang'
], function(
	lang
) {
	return function(store, options) {
		return lang.delegate(store, {
			query: function(query, options) {
				var queryResultStore = lang.delegate(this, {});
				queryResultStore._query = lang.mixin(this._query, query);
				return queryResultStore;
			},
			forEach: function(callback) {
				store.query(this._query).forEach(callback);
			}
		});
	};
});
