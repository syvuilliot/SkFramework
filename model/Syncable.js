define([
	"dojo/when",
	"collections/shim-object",
], function(
	when
){
	var Syncable = function(args){
		// default values
		this.syncIdProperty = "id";
		this.getSyncId = function(rsc){
			return this.getPropValue(rsc, this.syncIdProperty);
		};
		this.lastSourceDataProperty = "lastSourceData";
		this.getResponse2Data = function(response){
			return response;
		};
		this.putResponse2Id = function(response){
			return response[this.syncIdProperty];
		};
		this.putResponse2Data = function(response){
			return response;
		};

		this.getSourceData = function(rsc) {
			return this.logRequest(rsc, "get", this.dataSource.get(this.getSyncId(rsc)));
		};
		this.putSourceData = function(rsc, data) {
			var options = {};
			var id = this.getSyncId(rsc);
			if (id) {options.id = id;}
			return this.logRequest(rsc, "put", this.dataSource.put(data, options));
		};
		this.deleteSourceData = function(rsc){
			return this.logRequest(rsc, "delete", this.dataSource.remove(this.getSyncId(rsc)));
		};
		this.logRequest = function(rsc, type, result) {
			var status = {
				type: type,
				started: new Date(),
				stage: "inProgress",
				finished: null,
				response: null,
				// request: result,
			};
			this.setPropValue(rsc, "lastRequestStatus", status);

			return result.then(function(response){
				status.stage = "success";
				status.response = response;
				status.finished = new Date();
				return response;
			}, function(response){
				status.stage = "error";
				status.response = response;
				status.finished = new Date();
				return response;
			});
		};

		this.isInSync = function(rsc){
			var localState = this.serialize(rsc);
			var remoteState = this.getPropValue(rsc, this.lastSourceDataProperty);
			remoteState = remoteState && remoteState.data;
			return Object.equals(localState, remoteState);
		};

		var create = this.create;
		this.create = function(args){
			var mng = this;
			// call inherited
			var rsc = create.call(this, args);
			// add methods on rsc
			rsc.fetch = function(){
				return mng.fetch(rsc);
			};
			rsc.push = function(){
				return mng.push(rsc);
			};
			rsc.pull = function(){
				return mng.pull(rsc);
			};
			rsc.merge = function(){
				return mng.merge(rsc);
			};
			// update inSync
			this.setPropValue(rsc, "inSync", this.isInSync(rsc));

			return rsc;
		};

		this.fetch = function(rsc){
			return this.getSourceData(rsc).then(function(response){
				var data = this.getResponse2Data(response);
				this.setPropValue(rsc, this.lastSourceDataProperty, {
					time: new Date(),
					data: data,
				});
				return response;
			}.bind(this));
		};
		this.merge = function(rsc, options){
			this.deserialize(rsc, this.getPropValue(rsc, this.lastSourceDataProperty).data, options);
		};
		this.push = function(rsc, options){
			var data = this.serialize(rsc);
			return this.putSourceData(rsc, data).then(function(response){
				var id = this.putResponse2Id(response);
				var responseData = this.putResponse2Data(response);
				id && this.setPropValue(rsc, this.syncIdProperty, id);
				// the default behavior is to update lastSourceData after a successfull put either with the response data or with the local data. This way, we don't need a fetch request.
				if (!options || !options.preventLastSourceDataUpdate) {
					this.setPropValue(rsc, this.lastSourceDataProperty, {
						time: new Date(),
						data: responseData ? responseData : data,
					});
				}
				return response;
			}.bind(this));
		};
		this.pull = function(rsc){
			return this.fetch(rsc).then(function(){
				this.merge(rsc);
			}.bind(this));
		};


	};
	return Syncable;
});