define([
	'./constructor',
	'collections/map',	'collections/set'
], function(
	ctr,
	Map,				Set
) {
	return ctr(function () {
		this._keyValuesMap = new Map();
		this._valueKeysMap = new Map();
	}, {
		_addKeys: function(keys, value) {
			var valueKeys = this._valueKeysMap.get(value);
			if (!valueKeys) {
				valueKeys = new Set();
				this._valueKeysMap.add(valueKeys, value);
			}
			valueKeys.addEach(keys);
		},

		_addValues: function(values, key) {
			var keyValues = this._keyValuesMap.get(key);
			if (!keyValues) {
				keyValues = new Set();
				this._keyValuesMap.add(keyValues, key);
			}
			keyValues.addEach(values);
		},

		add: function(values, keys) {
			values.forEach(function(value) {
				this._addKeys(keys, value);
			}.bind(this));

			keys.forEach(function(key) {
				this._addValues(values, key);
			}.bind(this));
		},

		getValues: function(key) {
			var values = this._keyValuesMap.get(key)
			return values && values.toArray();
		},

		getKeys: function(value) {
			var keys = this._valueKeysMap.get(value);
			return keys && keys.toArray();
		},

		keys: function() {
			return this._keyValuesMap.keys();
		},

		values: function() {
			return this._valueKeysMap.keys();
		},

		hasValue: function(value) {
			return this.values().indexOf(value) > -1;
		},

		hasKey: function(key) {
			return this.keys().indexOf(key) > -1;
		}
	});
});
