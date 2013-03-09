define([
	"compose/compose",
	"dojo/when",
], function(
	compose,
	when
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
		var result = this._dataSource.get(this.getId(rsc));
		this._logStatus(rsc, "get", result);
		return result;
	};

	proto.requestPut = function(rsc, data) {
		var options = {};
		var id = this.getId(rsc);
		if (id) {options.id = id;}
		var result = this._dataSource.put(data, options);
		this._logStatus(rsc, "put", result);
		return result;
	};

	proto.resquestDelete = function(rsc){
		var result = this._dataSource.remove(this.getId(rsc));
		this._logStatus(rsc, "delete", result);
		return result;
	};

	proto.getRequestStatus = function(rsc){
		return this._requestsStatus.get(rsc);
	};

	proto._logStatus = function(rsc, type, result) {
		var status = {
			type: type,
			startedDate: new Date(),
			stage: "inProgress",
			finishedDate: null,
			response: null,
		};
		this._requestsStatus.set(rsc, status);
		when(result, function(response){
			status.stage = "success";
			status.finishedDate = new Date();
			status.response = response;
		}, function(response){
			status.stage = "error";
			status.finishedDate = new Date();
			status.response = response;
		});
	};

	proto.unregister = compose.after(function(rsc){
		this._requestsStatus.delete(rsc);
	});

	return Connected;
});
