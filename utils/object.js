define([], function(){
	var objectUtils = {};

	objectUtils.copyOwnProperties = function(source, target) {
        Object.getOwnPropertyNames(source).forEach(function(propName) {
            Object.defineProperty(target, propName,
                Object.getOwnPropertyDescriptor(source, propName));
        });
        return target;
    };
	
	objectUtils.sameValue = function(o1, o2){
		// Degenerate case: if they are both null, then their "properties" are equal.
		if(o1 === null && o2 === null){
			return true;
		}
		// If only one is null, they aren't equal.
		if(o1 === null || o2 === null){
			return false;
		}
		if(o1 instanceof Date){
			return o2 instanceof Date && o1.getTime()==o2.getTime();
		}
		var x;
		// Make sure ALL THE SAME properties are in both objects!
		for(x in o2){ // Lets check "o2" here, o1 is checked below.
			if(o1[x] === undefined){
				return false;
			}
		}

		for(x in o1){
			if(o1[x] != o2[x]){
				return false;
			}
		}
		return true;
	};

	return objectUtils;
});