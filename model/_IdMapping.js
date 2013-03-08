define([
], function(
) {
	/*
	* Mixin that primarily index resources by Id
	* It also create an abstraction to the id storage implementation, either directly on the resource or in a separate table
	*/
	function IdMapping(args){
		this._idProperty = args && args.idProperty || undefined;
		if (! this._idProperty) this._rsc2id = new Map(); // only created if the id is not stored directly on the resource
		this._id2rsc = new Map();
	}

	var proto = IdMapping.prototype;

	proto.setId = function(rsc, id) {
		if (this._idProperty) {
			rsc[this._idProperty] = id;
		} else {
			this._rsc2id.set(rsc, id);
		}
		this._id2rsc.set(id, rsc);
	};

	proto.getId = function(rsc) {
		if (this._idProperty) {
			return rsc[this._idProperty];
		} else {
			return this._rsc2id.get(rsc);
		}
	};

	proto.getById = function(id) {
		return this._id2rsc.get(id);
	};

	proto.hasId = function(id){
		return this._id2rsc.has(id);
	};

	return IdMapping;
});
