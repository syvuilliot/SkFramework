define([
	'collections/set',
	'collections/map',
	'./proxyFunctions',
	"dojo/Evented",
], function(
	Set,
	Map,
	proxy,
	Evented
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
		this._indexValue(value, key);
		// emit event
		this._emit("added", {key: key, value: value});

	};

	proto.setKey = function(value, key){
		this._unindexValue(value);
		this._indexValue(value, key);
	};

	proto._indexValue = function(value, key){
		var values = this._index.get(key);
		if(!values){
			values = new Set();
			this._index.set(key, values);
		}
		values.add(value);
	};
	proto._unindexValue = function(value){
		var key = this.getKey(value);
		var values = this._index.get(key);
		values.delete(value);
		if (values.length === 0){
			this._index.delete(key);
		}
	};

	proto.addEach = function(values){
		if (typeof values.forEach === "function") {
			values.forEach(function (value, key) {
				this.add(value, key);
			}, this);
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
		// emit event
		this._emit("removed", {key: key, value: value});

	};
	proto.removeEach = function(values){
		if (typeof values.forEach === "function") {
			values.forEach(function (value, key) {
				this.remove(value);
			}, this);
		} else {
			// copy other objects as map-alikes
			Object.keys(values).forEach(function (key) {
				this.remove(values[key]);
			}, this);
		}
	};
	proto.removeAll = function(){
		this.removeEach(this._values.keys());
	};

	proto.getValues = function(key){
		var valuesSet = this._index.get(key);
		return valuesSet ? valuesSet.toArray() : [];
	};

	proto.forEach = function(cb){
		return this._values.forEach(function(value, key){
			cb(key, value, this);
		});
	};

	proxy.props(proto, "_values", ["length"]);

	proxy.methods(proto, "_values", {
		"has": "has",
		"getKey": "get",
	});

	proxy.methods(proto, "_index", {
		"hasKey": "has",
	});

	// Provider API
	proto.get = function(key){
		return this.getValues(key)[0];
	};
	proto.release = function(){};

	// Evented API
	proto.on = Evented.prototype.on;
	proto._emit = Evented.prototype.emit;

	return Registry;
});
