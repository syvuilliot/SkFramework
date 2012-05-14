define([], function(){

return function (a, b, arrayOrderIrelevant) {
  
    var replacer = function (key, value) {
        
		if(key===""){
			if (Array.isArray(value) && arrayOrderIrelevant){
				return value.sort(function(a,b){
					if (JSON.stringify(a, replacer) > JSON.stringify(b, replacer)){
						return 1;
					} else { 
						return -1;
					}
				});
			}
		}
		
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            return value;
        }
		
        
        var result = [];
        
        Object.keys(value).sort().forEach(function(key) {
            result.push([key, value[key]]);
        });
        
        return result; 
    };
    
    return JSON.stringify(a, replacer) === JSON.stringify(b, replacer);
};

});