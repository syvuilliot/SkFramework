define([], function(){

/*
    Original script title: "Object.identical.js"; version 1.12
    Copyright (c) 2011, Chris O'Brien, prettycode.org
    http://github.com/prettycode/Object.identical.js

    Permission is hereby granted for unrestricted use, modification, and redistribution of this
    script, only under the condition that this code comment is kept wholly complete, appearing
    directly above the script's code body, in all original or modified non-minified representations
*/

return function (a, b, sortArrays) {
  
    function sort(object) {
        
        if (typeof object !== "object" || object === null) {
            return object;
        }
		
		if (Array.isArray(object)){
			if (sortArrays === true) {
				return object.sort(function(a,b){
					if (JSON.stringify(a) > JSON.stringify(b)){
						return 1;
					} else { 
						return -1;
					}
				});
			} else {
				return object
			}
		}
        
        var result = [];
        
        Object.keys(object).sort().forEach(function(key) {
            result.push({
                key: key,
                value: sort(object[key])
            });
        });
        
        return result; 
    }
    
    return JSON.stringify(sort(a)) === JSON.stringify(sort(b));
};

});