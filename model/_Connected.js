define([
	"compose/compose",
	"dojo/when",
	"collections/map",
	"ksf/utils/mixinProperties",
], function(
	compose,
	when,
	Map,
	mixin
) {
	/*
	* Mixin that allow communication with a dataSource based on resource references
	*/
	function Connected(args){
		this._dataSource = args && args.dataSource; // in this implementation, dataSource should conform to the dojo store API
		this._requestsStatus = new Map();
	}

	var proto = Connected.prototype;

	proto.requestGet = function(rsc) {
		var result = this._dataSource.get(this.getKey(rsc));
		this._logStatus(rsc, "get", result);
		return result;
	};

	proto.requestPut = function(rsc, data) {
		var options = {};
		var id = this.getKey(rsc);
		if (id) {options.id = id;}
		var result = this._dataSource.put(data, options);
		this._logStatus(rsc, "put", result);
		return result;
	};

	proto.resquestDelete = function(rsc){
		var result = this._dataSource.remove(this.getKey(rsc));
		this._logStatus(rsc, "delete", result);
		return result;
	};

	// allow to observe an object that reflects the status of the last started request
	// this is a simplified mechanism for a view to observe the network activity concerning a resource
	proto.getRequestStatus = function(rsc){
		return this._requestsStatus.get(rsc);
	};

	proto._logStatus = function(rsc, type, result) {
		var status = this._requestsStatus.get(rsc);
		mixin(status, {
			type: type,
			started: new Date(),
			stage: "inProgress",
			finished: null,
			response: null,
			request: result,
		});
		when(result, function(response){
			// prevent an "old" request from changing status
			if (status.request === result){
				status.stage = "success";
				status.response = response;
				status.finished = new Date();
			}
		}, function(response){
			// prevent an "old" request from changing status
			if (status.request === result){
				status.stage = "error";
				status.response = response;
				status.finished = new Date();
			}
		});
	};

	proto.add = compose.after(function(rsc){
		this._requestsStatus.set(rsc, {});
	});

	proto.remove = compose.after(function(rsc){
		this._requestsStatus.delete(rsc);
	});

	return Connected;
});
