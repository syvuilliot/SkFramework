define([

], function(

){
	var destroy = function(value){
		if (value && value.destroy) {
			value.destroy();
		} else if (typeof value === "function") {
			value();
		}
	};
	return destroy;
});