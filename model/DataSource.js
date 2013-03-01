define([
	"compose/compose",
	"collections/map",
], function(
	compose,
	Map
) {
	return compose(function DataSource(args){
			this._registry = new Set();
			this._source = args && args.source;
			this._rsc2id = new Map();
			this._id2rsc = new Map();
			this._rsc2usersCount = new Map();
		},
		{
		/*
		 * (Injected function)
		 * Create a new (empty) resource
		 *
		 * @return {Object}	resource
		 */
		createResource: function(data) {},
		/*
		 * (Injected function)
		 * Update a resource with provided data and resolve relations
		 *
		 * @param {Object}	resource	Resource to update
		 * @param {Object}	data		Raw data from data source
		 */
		updateResource: function(resource, data) {
			// si resource est une collection, il faut résoudre ses éléments, c'est à dire transformer les id en ressources
		},
		forgetResource: function(resource) {
			// lors qu'une ressource n'est plus utilisée, il faut déclarer ne plus avoir besoin des resources liées et la désenregistrer

		},

		/*
		 * (Injected function)
		 * Serialize a resource as raw data
		 *
		 * @param {Object}	resource	Resource
		 * @return {Object}	Raw data
		 */
		serializeResource: function(resource) {},

		/*
		 * Reference to a data source
		 * In this implementation, the source should conform to the dojo/store API
		 */
		_source: undefined,

		/*
		 * Registry of known resources
		 */
		_registry: null,

		/*
		 * Index of resources by id
		 */
		_id2rsc: null,

		/*
		 * Mapping between resources and data source ids
		 * only needed if the id is not directly available on the resource
		 */
		_rsc2id: null,

		/*
		 * Add resource to all registries
		 */
		register: function(rsc, id) {
			if (! this.hasResource(rsc)){
				this._registry.add(rsc);
				this._id2rsc.set(id, rsc);
				this._rsc2id.set(rsc, id);
				this._rsc2usersCount.set(rsc, 0);
			}
		},

		/*
		 * Remove resource from all registries
		 */
		unregister: function(rsc) {
			this.forgetResource(rsc); // permet à la resource de se désinitialiser (désactiver ses observers, libérer le lien vers les resources liées, ...)
			var id = this.getId(rsc);
			this._id2rsc.delete(id);
			this._rsc2id.delete(rsc);
			this._registry.delete(rsc);
		},

		/*
		* helper fonctions used by the application to delegate following the number of users of a resource
		* when a ressource is no more used, the mapping can be forgoten to liberate memory consumption
		* if the resource is needed after that, a new reference will be created
		*/
		using: function(rsc) {
			var usersCount = this._rsc2usersCount.get(rsc);
			this._rsc2usersCount.set(rsc, usersCount + 1);
		},
		noMoreUsing: function(rsc) {
			var usersCount = this._rsc2usersCount.get(rsc);
			usersCount--;
			this._rsc2usersCount.set(rsc, usersCount);
			// faut-il déclencher "unregister" automatiquement ou bien faut-il que ce soit un "clean" qui se charge de balayer toutes les ressources connues pour désenregistrer celles qui ne sont plus utilisées ?
			if (usersCount <= 0) {
				this.unregister(rsc);
				this._rsc2usersCount.delete(rsc);
			}
		},
		_rsc2usersCount: null,



		/*
		 * Get a resource or collection from registry or create a new one
		 *
		 * @param {Object}	id	Parameters identifying a resource or collection
		 * @return {Object}	resource or collection
		 */
		getResource: function(id) {
			var resource = this._id2rsc.get(id);
			if (!resource) {
				resource = this.createResource();
				this.register(resource, id);
			}
			return resource;
		},

		hasResource: function(rsc) {
			return this._registry.has(rsc);
		},

		/*
		 * Search for id of resource in the index
		 *
		 * @return {Object|undefined}	Id or nothing if not found
		 */
		getId: function(resource) {
			return this._rsc2id.get(resource);
			// une autre option serait : return resource.id;
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
			var result = this._requestData(id);
			result.then(function(data){
				this.updateResource(resource, data);
			}.bind(this));
			// TODO: implement error case
			return result;
		},

		/*
		 * Put a resource or collection into data source
		 *
		 * @param {Object}	resource	Resource
		 */
		put: function(resource) {
			var id = this.getId(resource);
			var result;
			if (id) { // updating case
				result = this._updateData(this.serializeResource(resource), id);
			} else { // creation case
				result = this._createData(this.serializeResource(resource));
				result.then(function(response){
					this._rsc2id.set(resource, response.id);
				}.bind(this));
				// TODO: implement error case
			}
			// si le serveur renvoi les données de la ressource, on peut en profiter pour la mettre à jour
			result.then(function(response){
				if (response.data) {
					this.updateResource(resource, response.data);
				}
			}.bind(this));
			return result;
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

			var result = this._deleteData(id);
			result.then(function(response){
				this.unregister(resource); // faut-il appeler unregsiter automatiquement ?
			});
			// TODO: implement error case
			return result;
		},

		/*
		 * Request raw data from data source
		 *
		 * @param {Object}	params	Parameters identifying a resource or collection
		 * @return {Object}	raw data
		 */
		_requestData: function(id) {
			return this._source.get(id);
		},

		/*
		 * Request an update of data source with raw data
		 *
		 * @param {Object}	data	Raw data
		 * @param {Object}	id		Parameters identifying a resource or collection
		 */
		_updateData: function(data, id) {
			return this._source.put(data, {id: id});
		},

		/*
		 * Request creation of a resource in data source with raw data
		 *
		 * @param {Object}	data	Raw data
		 */
		_createData: function(data, id) {
			return this._source.add(data, {id: id});
		},

		/*
		 * Request deletion of a resource from data source
		 *
		 * @param {Object}	params	Parameters identifying a resource or collection
		 */
		_deleteData: function(id) {
			return this._source.delete(id);
		}
	});
});
