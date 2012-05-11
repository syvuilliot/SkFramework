define([
	"./object",
], function(objectUtils){
	var arrayUtil = {};
	
	//function to compare that 2 arrays contain the same elements but possibly in a different order
	arrayUtil.sameArray = function (a1, a2, strictEquality){
		if (a1.length != a2.length){return false}
		
		//for strictEquality comparaison of items (use Array.prototype.indexOf)
		if (strictEquality) {
			a1.forEach(function(el){
				if(a2.indexOf(el) == -1){return false}
			});

			//for non strictEquality comparaison of items
		} else {
			a1.forEach(function(a1el){
				var found = false;
				a2.forEach(function(a2el){
					if(a2el == a1el || objectUtils.sameValue(a2el, a1el)){found=true}
				});
				if (found == false){return false}
			});
		}
		
		return true;
	};
	
	return arrayUtil;
});