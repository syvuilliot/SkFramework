define([
	"ksf/utils/constructor",
], function(
	ctr
){
	return ctr(function TryEach(){
		// this is a public property so user can manipulate it directly for adding or removing actionners
		this.actionners = [];
		// at construction, this.actionners is populated from arguments
		Array.prototype.forEach.call(arguments, function(actionner){
			this.actionners.push(actionner);
		}, this);
	}, {
		// try each actionner until one respond with true, which means it sucessfully done the action
		execute: function(){
			var args = arguments;
			return this.actionners.some(function(actionner){
				try {
					return actionner.execute.apply(null, args);
				} catch (err) {
					return false;
				}
			});
		},
	});
});