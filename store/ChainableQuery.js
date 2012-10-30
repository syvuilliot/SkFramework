define([
	'dojo/_base/lang'
], function(
	lang
) {
	//wrapper to add dojo.store API on queryResults and allow chainable queries
	return function(store, options) {
		var chainableStore = lang.delegate(store, {
			query: function(query, options) {
				var queryResult = store.query(query, options);
				//add dojo.store API to the queryResult
				["get", "put", "add", "remove", "getIdentity"].forEach(function(method){
					queryResult[method] = function(){
						return store[method].apply(store, arguments);
					};
				});
				//add a modified version of query method to allow chainable queries
				queryResult._query = query;
				queryResult.query = function(query, options){
					return chainableStore.query(lang.mixin({}, this._query, query), options);
				};
				return queryResult;
			},
		});
		return chainableStore;
	};
});
