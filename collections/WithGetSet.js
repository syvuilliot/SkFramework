define([

], function(

){
	var WithGetSet = function(){
	};
	WithGetSet.prototype = {
		remove: function(prop){
			var value = this.get(prop);
			this._startChanges();
			if (this["_"+prop+"Remover"]){
				this["_"+prop+"Remover"](prop);
			} else {
				this["_Remover"](prop); // default
			}
			this._pushChanges({type: "remove", value: value, key: prop});
			this._stopChanges();
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
			this._startChanges();
			if (this["_"+prop+"Setter"]){
				this["_"+prop+"Setter"](settedValue);
			} else {
				this["_Setter"](prop, settedValue); // default setter
			}
			var value = this.get(prop);
			this._pushChanges([
				{type: 'remove', value: value, key: prop},
				{type: 'add', value: this.get(prop), key: prop}
			]);
			this._stopChanges();
		},
		has: function(prop){
			if (this["_"+prop+"Detector"]){
				return this["_"+prop+"Detector"](prop);
			} else {
				return this["_Detector"](prop); // default detector
			}
		},
		setEach: function(values){
			this._startChanges();
			Object.keys(values).forEach(function(key){
				this.set(key, values[key]);
			}, this);
			this._stopChanges();
		},
	};
	return WithGetSet;
});