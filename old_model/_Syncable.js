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
		this._syncStatus = new Map();
		this._lastChangeTime = new Map();
		this._lastInSyncTime = new Map();
		this.serialize = args.serialize;
		this.deserialize = args.deserialize;
		this.compare = args.compare;
		if (args.fetchResponse2data) {this._fetchResponse2data = args.fetchResponse2data;}
		if (args.pushResponse2data) {this._pushResponse2data = args.pushResponse2data;}
		if (args.pushResponse2id) {this._pushResponse2id = args.pushResponse2id;}
	}

	var proto = Syncable.prototype;

	proto.commit = function(rsc){
		this._lastChangeTime.set(rsc, new Date());
		this._updateSyncStatus(rsc);
	};

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
		var result = this.requestPut(rsc, this.serialize(rsc));
		when(result, function(response){
			// we update id if different (on most cases it should be at creation only)
			var responseId = this._pushResponse2id(response);
			if (responseId !== this.getKey(rsc)){
				this.setKey(rsc, responseId);
			}
			// we update data if the server send them in its response
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
		this.deserialize(rsc, this.getSourceData(rsc));
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
		this._updateSyncStatus(rsc);
	};

	proto.getSourceData = function(rsc){
		return this._sourceMirror.get(rsc);
	};

	proto._updateSyncStatus = function(rsc){
		// here we use a time comparison but it could be "revision", or another method
		var lastChangeTime = this._lastChangeTime.get(rsc);
		var lastInSyncTime = this._lastInSyncTime.get(rsc);
		var remoteStateTime = this._sourceMirrorDate.get(rsc);

		if (! lastChangeTime && ! remoteStateTime) {
			this._syncStatus.set(rsc, undefined); // new resource without data
		} else	if (lastChangeTime && ! remoteStateTime){
			this._syncStatus.set(rsc, "toSave"); // new resource with local data
		} else if (remoteStateTime && ! lastChangeTime){
			this._syncStatus.set(rsc, "toMerge"); // new resource with remote data and no local change
		} else {
			var local = this.serialize(rsc);
			var remote = this.getSourceData(rsc);
			if (this.compare(local, remote)){
				this._lastInSyncTime.set(rsc, new Date());
				this._syncStatus.set(rsc, "inSync"); // states are in sync (we don't care about the time stamps)
			} else {
				if (lastChangeTime > lastInSyncTime && remoteStateTime > lastInSyncTime){
					this._syncStatus.set(rsc, "conflict"); // the local state and the remote state have changed differently
				} else  if (lastChangeTime > lastInSyncTime) {
					this._syncStatus.set(rsc, "toSave"); // only the local state has changed
				} else {
					this._syncStatus.set(rsc, "toMerge"); // only the remote state has changed
				}
			}
		}
	};

	proto.getSyncStatus = function(rsc){
		return this._syncStatus.get(rsc);
	};

	proto.sync = function(rsc){
		// refresh data from data source, then send local resource or update it depending on the compare result
		when(this.fetch(rsc), function(){
			switch (this.getSyncStatus(rsc)) {
				case "toMerge":
					this.merge(rsc);
					break;
				case "toSave":
					this.push(rsc);
					break;
			}
		}.bind(this));

	};

	proto.remove = compose.after(function(rsc){
		this._sourceMirror.delete(rsc);
		this._sourceMirrorDate.delete(rsc);
		this._syncStatus.delete(rsc);
		this._lastChangeTime.delete(rsc);
		this._lastInSyncTime.delete(rsc);
	});

	return Syncable;
});
