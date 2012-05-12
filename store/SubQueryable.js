define([
	"dojo/_base/lang",
	"dojo/_base/Deferred",
	"dojo/store/util/QueryResults",
], function(lang, Deferred, QueryResults) {
	return function(store, options) {
		return lang.delegate(store, {
			query: function(query, options) {
				var queryResultStore = lang.delegate(this, {});
				queryResultStore._query = query;
				return queryResultStore;
			},
			forEach: function(callback) {
				store.query(this._query).forEach(callback);
			}
		});
	};
});
