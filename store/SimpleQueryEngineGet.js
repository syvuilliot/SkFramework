define(["dojo/_base/array", "../utils/identical"], function(arrayUtil, identical) {

return function(query, options){
	// summary:
	//		Based on dojo/store/util/SimpleQueryEngine but use "get" method on objects if available
	//		and handle a special case where the queried property name is "instanceof"

	// create our matching query function
	switch(typeof query){
		case "object": case "undefined":
			var queryObject = query;
			query = function(object){
				for(var key in queryObject){
					var required = queryObject[key];
					//special case when key is "instanceof"
					if (key == "instanceof"){
						if (!(object instanceof required)){return false;}
					} else {
					//all other cases
						var propValue;
						if(object.get){
							propValue = object.get(key);
						} else {
							propValue = object[key];
						}
						if(required && required.test){
							// an object can provide a test method, which makes it work with regex
							if(!required.test(propValue, object)){
								return false;
							}
						}else if(! identical(required, propValue)){
							return false;
						}
					}
				}
				return true;
			};
			break;
		case "string":
			// named query
			if(!this[query]){
				throw new Error("No filter function " + query + " was found in store");
			}
			query = this[query];
			// fall through
			break;
		case "function":
			// fall through
			break;
		default:
			throw new Error("Can not query with a " + typeof query);
	}
	function execute(array){
		// execute the whole query, first we filter
		var results = arrayUtil.filter(array, query);
		// next we sort
		if(options && options.sort){
			results.sort(function(a, b){
				for(var sort, i=0; sort = options.sort[i]; i++){
					var aValue = a[sort.attribute];
					var bValue = b[sort.attribute];
					if (aValue != bValue) {
						return !!sort.descending == aValue > bValue ? -1 : 1;
					}
				}
				return 0;
			});
		}
		// now we paginate
		if(options && (options.start || options.count)){
			var total = results.length;
			results = results.slice(options.start || 0, (options.start || 0) + (options.count || Infinity));
			results.total = total;
		}
		return results;
	}
	execute.matches = query;
	return execute;
};
});
