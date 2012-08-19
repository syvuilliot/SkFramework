define([], function() {
	return function(store) {
		var originalQuery = store.query;
		store.query = function(query, options){
			var results = originalQuery.apply(this, arguments);
			if(results && results.observe) {
				var originalMap = results.map;
				results.map = function(itemFn) {
					mapResults = originalMap.apply(this, arguments);
					mapResults.observe = function(callback) {
						return results.observe(function(item, removedFrom, insertedInto) {
							callback(itemFn(item), removedFrom, insertedInto);
						});
					}
					return mapResults;
				}
			}
			return results;
		}
		return store;
	}
});
