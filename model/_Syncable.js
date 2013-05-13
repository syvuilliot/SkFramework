define([
	"compose/compose",
	"dojo/Deferred",
	"dojo/when",
	"collections/map",
], function(
	compose,
	Deferred,
	when,
	Map
) {
	/*
	* Mixin that allow syncing between resources and data from a dataSource
	*/
	function Syncable(args){
		this._sourceMirror = new Map();
		this._sourceMirrorDate = new Map();
		this._compareState = args.compare;
		if (args.fetchResponse2data) {this._fetchResponse2data = args.fetchResponse2data;}
		if (args.pushResponse2data) {this._pushResponse2data = args.pushResponse2data;}
		if (args.pushResponse2id) {this._pushResponse2id = args.pushResponse2id;}
	}

	var proto = Syncable.prototype;

	proto.fetch = function(rsc) {
		var result = this.requestGet(rsc);
		when(result, function(response){
			this._storeSourceData(rsc, this._fetchResponse2data(response));
		}.bind(this));
		return result;
	};
	// to be overridden depending on dataSource response format
	proto._fetchResponse2data = function(response){
		return response.data;
	};

	proto.push = function(rsc) {
		var result = this.requestPut(rsc, this.getState(rsc));
		when(result, function(response){
			// we update id if different (on most cases it should be at creation only)
			var responseId = this._pushResponse2id(response);
			if (responseId !== this.getKey(rsc)){
				this.setId(rsc, responseId);
			}
			// we update data if server send them in its response
			var responseData = this._pushResponse2data(response);
			if (responseData) {
				this._storeSourceData(rsc, responseData);
			}
		}.bind(this));
		return result;
	};
	// to be overridden depending on dataSource response format
	proto._pushResponse2id = function(response){
		return response.id;
	};
	proto._pushResponse2data = function(response){
		return response.data;
	};

	// there could be other merge logic (for example, only merging if rsc was not updated localy otherwise registering a conflict)
	proto.merge = function(rsc){
		this.update(rsc, this.getSourceData(rsc));
	};

	proto.pull = function(rsc){
		var dfd = new Deferred();
		when(this.fetch(rsc), function(){
			this.merge(rsc);
			dfd.resolve(rsc);
		}.bind(this));
		return dfd;
	};

	proto._storeSourceData = function(rsc, data){
		this._sourceMirror.set(rsc, data);
		this._sourceMirrorDate.set(rsc, new Date());
	};

	proto.getSourceData = function(rsc){
		return this._sourceMirror.get(rsc);
	};

	proto.getSyncStatus = function(rsc){
		// _compareState(a, b) should return :
		// 0 if the state are inSync
		// -1 if a is older than b
		// +1 if b is older than a
		var syncStatus = {
			sourceDataRefresh: this._sourceMirrorDate.get(rsc),
		};
		switch (this._compareState(this.getState(rsc), this.getSourceData(rsc))) {
			case 0:
				syncStatus.status = "inSync";
				break;
			case -1:
				syncStatus.status = "toUpdate";
				break;
			case +1:
				syncStatus.status = "toSave";
				break;
		}
		return syncStatus;

	};

	proto.sync = function(rsc){
		// refresh data from data source, then send local resource or update it depending on the compare result
		when(this.fetch(rsc), function(){
			switch (this.getSyncStatus(rsc)) {
				case -1:
					this.merge(rsc);
					break;
				case +1:
					this.push(rsc);
					break;
			}
		}.bind(this));

	};

	proto.remove = compose.after(function(rsc){
		this._sourceMirror.delete(rsc);
		this._sourceMirrorDate.delete(rsc);
	});

	return Syncable;
});
