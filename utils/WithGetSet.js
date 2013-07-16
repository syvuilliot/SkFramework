define([

], function(

){
	var WithGetSet = function(){
		this._changing = 0;
	};
	WithGetSet.prototype = {
		remove: function(prop){
			this._startChanging();
			if (this["_"+prop+"Remover"]){
				this["_"+prop+"Remover"](prop);
			} else {
				this["_Remover"](prop); // default
			}
			this._stopChanging();
		},
		get: function(prop){
			if (this["_"+prop+"Getter"]){
				return this["_"+prop+"Getter"](prop);
			} else {
				return this["_Getter"](prop); // default getter
			}
		},
		getEach: function(){
			return Array.prototype.map.call(arguments, function(prop){
				return this.get(prop);
			}, this);
		},
		set: function(prop, settedValue){
			this._startChanging();
			if (this["_"+prop+"Setter"]){
				this["_"+prop+"Setter"](settedValue);
			} else {
				this["_Setter"](prop, settedValue); // default setter
			}
			this._stopChanging();
		},
		has: function(prop){
			if (this["_"+prop+"Detector"]){
				return this["_"+prop+"Detector"](prop);
			} else {
				return this["_Detector"](prop); // default detector
			}
		},
		setEach: function(values){
			this._startChanging();
			Object.keys(values).forEach(function(key){
				this.set(key, values[key]);
			}, this);
			this._stopChanging();
		},
		_startChanging: function(){
			this._changing ++;
		},
		_stopChanging: function(){
			this._changing --;
			if (this._changing === 0){
				this._emit("changed");
			}
		},

	};
	return WithGetSet;
});