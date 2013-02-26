define([
	
], function(
	
) {
	return {
		/*
		 * (Injected function)
		 * Create a new (empty) resource
		 * 
		 * @return {Object}	resource
		 */
		create: function() {},
		/*
		 * (Injected function)
		 * Merge raw data into a resource
		 * 
		 * @param {Object}	data		Raw data from data source
		 * @param {Object}	resource	Resource to update
		 */
		merge: function(data, resource) {},
		
		/*
		 * (Injected function)
		 * Serialize a resource as raw data
		 * 
		 * @param {Object}	resource	Resource
		 * @return {Object}	Raw data
		 */
		serialize: function(resource) {},
		
		/*
		 * Mapping between resources and data source ids
		 */
		_registry: new Registry(),
		
		/*
		 * Add resource to registry with given id
		 */
		register: function(resource, id) {
		},
		
		/*
		 * Remove resource from registry
		 */
		unregister: function(resource) {
		},
		
		/*
		 * Get a resource or collection from registry or create a new one
		 * 
		 * @param {Object}	id	Parameters identifying a resource or collection
		 * @return {Object}	resource or collection
		 */
		get: function(id) {
			var resource = this._registry.get(id);
			if (!resource) {
				resource = this.register(this.create(), id);
			}
			return resource;
		},
		
		/*
		 * Search for id of resource in the registry
		 * 
		 * @return {Object|undefined}	Id or nothing if not found
		 */
		getId: function(resource) {
			this._registry.getKey(resource);
		},
		
		/*
		 * Fetch data for the resource from data source
		 * 
		 * @param {Object}	resource	Resource
		 * @return {Promise}	Promise of data
		 */
		fetch: function(resource) {
			var id = this.getId(resource);
			if (!id) { return; }
			
			return this._requestData(id);
		},
		
		/*
		 * Put a resource or collection into data source
		 * 
		 * @param {Object}	resource	Resource
		 */
		put: function(resource) {
			var id = this.getId(resource);
			if (!id) { return; }
			
			this._putData(this.serialize(resource), id);
		},

		/*
		 * Delete a resource or collection from data source
		 * 
		 * @param {Object}	resource	Resource
		 * @param {Object}	params		Parameters identifying the resource or collection
		 */
		'delete': function(resource) {
			var id = this.getId(resource);
			if (!id) { return; }
			
			this._deleteData(id);
		},

		/*
		 * Request raw data from data source
		 * 
		 * @param {Object}	params	Parameters identifying a resource or collection
		 * @return {Object}	raw data
		 */
		_requestData: function(params) {
		},
		
		/*
		 * Update raw data in data source
		 * 
		 * @param {Object}	data	Raw data
		 * @param {Object}	id		Parameters identifying a resource or collection
		 */
		_updateData: function(data, id) {
		},
		
		/*
		 * Create raw data in data source
		 * and add new id in registry
		 * 
		 * @param {Object}	data	Raw data
		 */
		_createData: function(data) {
		},
		
		/*
		 * Delete resource from data source
		 * 
		 * @param {Object}	params	Parameters identifying a resource or collection
		 */
		_deleteData: function(params) {
		}
	}
});
