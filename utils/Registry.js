define([
	'collections/set',
	'collections/map',
	'./proxyFunctions',
], function(
	Set,
	Map,
	proxy
) {
	/*
	* Registry is designed to store unique values (like a Set) but to allow an access by id if it is provided
	* Id can be a property of stored values or an independant value
	*/

	function Registry(args){
		this._idProperty = args && args.idProperty || undefined;
		this._values = new Map();
		this._index = new Map();
	}

	var proto = Registry.prototype;


	proto.add = function(value, id){
		// if no id is provided and that id should be available on the value, get it
		if (!id && this._idProperty) {id = value[this._idProperty];}
		// store value
		this._values.set(value, id);
		// index value by id
		var values = this._index.get(id);
		if(!values){
			values = new Set();
			this._index.set(id, values);
		}
		values.add(value);
	};

	proto.remove = function(value){
		var id = this.getId(value);
		// remove value
		this._values.delete(value);
		// remove index
		var values = this._index.get(id);
		values.splice(values.indexOf(value), 1);
		if (values.length === 0){
			this._index.delete(id);
		}
	};

	proto.getValues = function(id){
		var valuesSet = this._index.get(id);
		return valuesSet ? valuesSet.toArray() : [];
	};

	proxy.methods(proto, "_values", {
		"has": "has",
		"getId": "get",
	});

	proxy.methods(proto, "_index", {
		"hasId": "has",
	});

	return Registry;
});
