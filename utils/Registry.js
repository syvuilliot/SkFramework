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
	* Registry is designed to store unique values (like a Set) but to allow an access by key if it is provided
	* The key can be a property of stored values or an independant value
	*/

	function Registry(args){
		this._keyProperty = args && args.keyProperty || undefined;
		this._values = new Map();
		this._index = new Map();
	}

	var proto = Registry.prototype;


	proto.add = function(value, key){
		// prevent adding a value twice
		// its up to the user to remove it before adding it again if it need to change its key for example
		if (this.has(value)) {
			throw "A value can not be added twice";
		}
		// if no key is provided and that key should be available on the value, get it
		if (key === undefined && this._keyProperty) {
			key = value[this._keyProperty];
		}
		// store value
		this._values.set(value, key);
		// index value by key
		var values = this._index.get(key);
		if(!values){
			values = new Set();
			this._index.set(key, values);
		}
		values.add(value);
	};

	proto.addEach = function(values){
		if (typeof values.forEach === "function") {
			// copy map-alikes
			if (typeof values.keys === "function") {
				values.forEach(function (value, key) {
					this.add(value, key);
				}, this);
			// iterate key value pairs of other iterables
			} else {
				values.forEach(function (value) {
					this.add(value);
				}, this);
			}
		} else {
			// copy other objects as map-alikes
			Object.keys(values).forEach(function (key) {
				this.add(values[key], key);
			}, this);
		}
	};

	proto.remove = function(value){
		var key = this.getKey(value);
		// remove value
		this._values.delete(value);
		// remove index
		var values = this._index.get(key);
		values.delete(value);
		if (values.length === 0){
			this._index.delete(key);
		}
	};

	proto.getValues = function(key){
		var valuesSet = this._index.get(key);
		return valuesSet ? valuesSet.toArray() : [];
	};

	proxy.props(proto, "_values", ["length"]);

	proxy.methods(proto, "_values", {
		"has": "has",
		"getKey": "get",
		'items': 'items'
	});

	proxy.methods(proto, "_index", {
		"hasKey": "has",
	});

	return Registry;
});
