define([
	"compose/compose",
	"collections/map",
], function(
	compose,
	Map
) {
	/*
	* Mixin that allow storing the state of a resource multiple time and restoring it on demand
	*/
	function Versioning(args){
		this._serialize = args && args.serialize;
		this._historyLength = args && args.historyLength || 5;
		this._statesHistories = new Map();
	}

	var proto = Versioning.prototype;

	proto.storeState = function(rsc) {
		var history = this._statesHistories.get(rsc);
		// create an history if none already exists
		if (! history) {
			history = [];
			this._statesHistories.set(rsc, history);
		}
		// store state at the begining of the array
		var length = history.unshift(this.getState(rsc));
		// remove too old states
		if (length > this._historyLength) {
			history.pop();
		}
	};

	proto.getStoredState = function(rsc, index) {
		var history = this._statesHistories.get(rsc);
		return history && history[index || 0]; // get last state by default
	};

	proto.getState = function(rsc){
		return this._serialize(rsc);
	};

	proto.restoreState = function(rsc, position){
		this.update(rsc, this.getStoredState(rsc, position));
	};

	proto.unregister = compose.after(function(rsc){
		this._statesHistories.delete(rsc);
	});

	return Versioning;
});
