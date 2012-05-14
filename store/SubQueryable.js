define([
	'dojo/_base/lang'
], function(
	lang
) {
	//wrapper to add the QueryResult API on store and allow chainable queries
	return function(store, options) {
		return lang.delegate(store, {
			query: function(query, options) {
				var queryResultStore = lang.delegate(this, {});
				queryResultStore._query = lang.mixin({}, this._query, query);
				return queryResultStore;
			},
			forEach: function(callback) {
				store.query(this._query).forEach(callback);
			},
			remove: function(id){store.remove(id)}//to prevent creation of "data" property on this which is caused by current implementation of Memory store

		});
	};
});
