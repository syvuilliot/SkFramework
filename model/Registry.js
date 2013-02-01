define([
	'compose/compose',
	'frb/bind',
	'collections/map',
	"dojo/store/Memory",
	"dojo/when",
], function(
	compose,
	bind,
	Map,
	Memory,
	when
) {

	return compose(Map, function(){
		// workaround because bind cannot be updated with curl
		var array = this.asArray = [];
		var valueChanging = null;
		this.addBeforeMapChangeListener(function(value){
			valueChanging = value;
		});
		this.addMapChangeListener(function(value){
			var oldValue = valueChanging;
			// value added case
			if (oldValue === undefined){
				array.push(value);
			}
			// value removed case
			if (value === undefined){
				array.splice(array.indexOf(oldValue), 1);
			}
			// we should not have the case of value change
			// reset valueChanging
			valueChanging = null;
		});
	}, {
		get: compose.before(function(key){
			// if the requested key does not exist, we create a new instance
			// this permits to give a reference when resolving model relations even if the instance is not known at the time it is retrived
			if (!this.has(key)){
				this.createOrUpdate({id: key});
			}
		}),
		// to be overridden to create an instance or to update it form raw object
		// must return the created or updated instance
		createOrUpdate: function(args){

		},
		// the (remote) service again which we fetch data (must implement the dojo/store API)
		source: null,
		// regsitered queries
		// ressources returned by registered queries will be considered active in registry
		_queries: new Map(),
		// register query (object or string)
		addQuery: function(query){
			this._queries.set(query, []);
		},
		// unregister query
		removeQuery: function(query){
			this._queries.delete(query);
		},
		// update local data with a query to the (remote) source
		fetch: function(query){
			// TODO: if no query is specified, fetch all registered queries
			when(this.source.query(query), function(result){
				var queryRessources = [];
				this._queries.set(query, queryRessources);
				result.forEach(function(rawItem){
					// create or update instance and register it
					var t = this.createOrUpdate(rawItem);
					// register it also with the query
					queryRessources.push(t);
				}.bind(this));
				this.clean();

			}.bind(this));
		},
		// send local changes to the remote source
		// TODO:
		save: function(query){
			var queryRessources = this._queries.get(query);
			queryRessources.filter(function(r){
				return r._localVersion;
			}).forEach(function(r){
				// case "created", "updated" : this.source.put(this.serialize(r)) then this.createOrUpdate(response)
				// case "deleted" : this.source.remove(r.id) then this._deletedRessources.delete(r)
			});
			// how to deal with all this asynchronous calls ?
		},
		sync: function(query){
			this.save(query).then(function(){
				this.fetch(query);
			});
		},
		// remove ressources that are not part of registered queries
		clean: function(){
			var remainingRessources = this.toArray();
			this._queries.forEach(function(queryRessources){
				queryRessources.forEach(function(ressource){
					remainingRessources.delete(ressource);
				});
			});
			remainingRessources.forEach(function(ressource){
				var id = this.find(ressource);
				this.delete(id);
			}.bind(this));
		},
		// helper function to retrieve the id of a ressource
		find: function(value){
			var key;
			this.forEach(function(v, k){
				if (v === value) {key = k;}
				// I don't know how to exit
			});
			return key;
		},
	});


});
