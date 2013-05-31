define([

], function(

){
	var WithUpdateSyncStatus = function(){
		var set = this.set;
		this.set = function(rsc){
			set.apply(this, arguments);
			this.owner.setPropValue(rsc, "inSync", this.owner.isInSync(rsc));
		};
	};
	return WithUpdateSyncStatus;
});