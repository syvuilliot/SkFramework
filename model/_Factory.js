define([
], function(
) {
	function Factory(args){
		if (args) {
			if (args.createResource) this._createResource = args.createResource;
			if (args.updateResource) this._updateResource = args.updateResource;
			if (args.destroyResource) this._destroyResource = args.destroyResource;
		}
	}

	var proto = Factory.prototype;

	/*
	 *
	 * Create a new (empty) resource and register it
	 *
	 * @return {Object}	resource
	 */
	proto.create = function(data) {
		var rsc = this._createResource(data);
		this.register(rsc, this.getId(rsc));
		return rsc;
	};

	/*
	 * Update a resource with provided data
	 * This is where we can resolve resolve relations to other resourcesManagers or to the same in case of reflected relations
	 *
	 * @param {Object}	resource	Resource to update
	 * @param {Object}	data		Raw data from data source
	 */
	proto.update = function(resource, data) {
		this._updateResource(resource, data);
		return resource;
	};

	proto.destroy = function(resource) {
		// lors qu'une ressource n'est plus utilisée, il faut déclarer ne plus avoir besoin des resources liées et la désenregistrer
		this._destroyResource(resource);
		return true;
	};

	return Factory;
});
