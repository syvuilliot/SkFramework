define([

], function(

){
	var Destroyable = function(){
		this._owned = [];
	};
	Destroyable.prototype = {
		own: function(o){
			this._owned.push(o);
			return o;
		},
		unown: function(o){
			this._owned.delete(o);
		},
		destroy: function(){
			this._owned.forEach(function(o){
				if (typeof o === "function"){
					o();
				} else {
					o.destroy && o.destroy();
				}
				this.unown(o);
			}.bind(this));
		},
	};

	return Destroyable;
});