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
			return response;
		};
		this.putResponse2Data = function(response){
		};

		var setPropValue = this.setPropValue;
		this.setPropValue = function(rsc, propName, value){
			setPropValue.apply(this, arguments);
			setPropValue.call(this, rsc, "inSync", this.isInSync(rsc));
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
			setPropValue.call(this, rsc, "inSync", this.isInSync(rsc));

			return rsc;
		};

		this.fetch = function(rsc){
			return this.dataSource.get(this.getSyncId(rsc)).then(function(response){
				var data = this.getResponse2Data(response);
				this.setPropValue(rsc, this.lastSourceDataProperty, {
					time: new Date(),
					data: data,
				});
			}.bind(this));
		};
		this.merge = function(rsc, options){
			this.deserialize(rsc, this.getPropValue(rsc, this.lastSourceDataProperty).data, options);
		};
		this.push = function(rsc, options){
			options = options || {};
			var data = this.serialize(rsc);
			var id = this.getSyncId(rsc);
			if (id) options.id = id;
			return this.dataSource.put(data, options).then(function(response){
				var id = this.putResponse2Id(response);
				var data = this.putResponse2Data(response);
				id && this.setPropValue(rsc, this.syncIdProperty, id);
				data && this.setPropValue(rsc, this.lastSourceDataProperty, data);
			});
		};
		this.pull = function(rsc){
			return when(this.fetch(rsc), function(){
				this.merge(rsc);
			}.bind(this));
		};


	};
	return Syncable;
});