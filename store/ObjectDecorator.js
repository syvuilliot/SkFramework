define([
	'dojo/_base/lang',
	'../utils/ObjectDecorator',
	'dojo/store/Memory'
], function(
	lang,
	ObjectDecorator,
	Memory
) {
	/*
	 * Store wrapper which exposes wrapped objects with extra properties & methods
	 * without modifying original store or its objects
	 * 
	 * @param store
	 * @param {Object} props	Properties & methods to add to each object
	 */
    return function(store, props) {
		return lang.delegate(store, {
			_wrapStore: new Memory(),
			/*
			 * Returns an object with extra properties
			 */
			_wrapObject: function(obj) {
				if (!this._wrapStore.get(obj.id)) {
					this._wrapStore.put(ObjectDecorator(obj, props));
				}
			},
			
			get: function(id) {
				this._wrapObject(store.get(id));
				return this._wrapStore.get(id);
			},
			
			query: function() {
				// Retrieve all potential results from source store
				var result = store.query.apply(store, arguments);
				// Ensure their wrapped version is in wrap store
				result.forEach(function(obj) {
					this._wrapObject(obj);
				}.bind(this));
				// Query the wrap store to take extra properties into account
				return this._wrapStore.query.apply(this._wrapStore, arguments);
			},
			
			put: function(obj, options) {
				// put original object (prototype of wrap object) into original store
				store.put(Object.getPrototypeOf(obj), options);
				// and put wrapped object into the wrap store
				this._wrapStore.put(obj, options);
			}
		});
	};
});