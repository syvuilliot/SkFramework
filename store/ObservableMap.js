define([], function() {
	return function(store) {
		var originalQuery = store.query;
		store.query = function(query, options){
			var results = originalQuery.apply(this, arguments);
			if(results && results.observe) {
				var originalMap = results.map;
				results.map = function(itemFn) {
					var mapResults = originalMap.apply(this, arguments);
					
					var mapItem;
					
					var originalNotify = store.notify;
					store.notify = function(item, existingId) {
						mapItem = null;
						return originalNotify.apply(this, arguments);
					}

					mapResults.observe = function(callback) {
						return results.observe(function(item, removedFrom, insertedInto) {
							if (mapItem === null) {
								if (removedFrom > -1) {
									mapItem = mapResults.splice(removedFrom, 1)[0];
								}
								if (insertedInto > -1) {
									if (mapItem === null) {
										// it's a new item
										mapItem = itemFn(item);
									}
									mapResults.splice(insertedInto, 0, mapItem);
								}
								notObservedYet = false;
							}
							callback(mapItem, removedFrom, insertedInto);
						});
					}
					mapResults.observe(function(){});
					return mapResults;
				};
			}
			return results;
		}
		return store;
	}
});
