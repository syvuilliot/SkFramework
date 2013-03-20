define([
	"compose/compose",
], function(
	compose
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
		if (this._idProperty) { // store the id directly on the resource
			rsc[this._idProperty] = id;
		} else { // store the id in a map table
			this._rsc2id.set(rsc, id);
		}
		// index resources by id
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

	proto.register = compose.after(function(rsc, id){
		// if no id is provided and that id should be stored on the resource, get it
		if (!id && this._idProperty) {id = rsc[this._idProperty];}
		// call setId only if it is defined
		if (id) {this.setId(rsc, id);}
	});
	proto.unregister = compose.after(function(rsc){
		var id = this.getId(rsc);
		if (! this._idProperty) {this._rsc2id.delete(rsc);}
		this._id2rsc.delete(id);
	});

	return IdMapping;
});
