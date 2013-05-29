define([

], function(

){
	var Syncable = function(args){
		this.dataSource = args.dataSource;
		this.syncIdProperty = args.syncIdProperty || "id";
		this.lastSourceDataProperty = args.lastSourceDataProperty || "lastSourceData";
		var create = this.create;
		this.create = function(args){
			var mng = this;
			var rsc = create.call(this, args);
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
			return rsc;
		};

		this.fetch = function(rsc){
			return this.dataSource.get(this.getPropValue(rsc, this.syncIdProperty)).then(function(response){
				var data = this.getResponse2Data(response);
				this.setPropValue(rsc, this.lastSourceDataProperty, {
					time: new Date(),
					data: data,
				});
			}.bind(this));
		};
		this.merge = function(rsc, options){
			this.deserialize(rsc, this.getPropValue(rsc, this.lastSourceDataProperty), options);
		};
		this.push = function(rsc, options){
			var data = this.serialize(rsc);
			var id = this.getPropValue(rsc, this.syncIdProperty);
			if (id) options.id = id;
			return this.dataSource.put(data, options).then(function(response){
				var id = this.putResponse2Id(response);
				var data = this.putResponse2Data(response);
				id && this.setPropValue(rsc, this.syncIdProperty, id);
				data && this.setPropValue(rsc, this.lastSourceDataProperty, data);
			});
		};
		this.getResponse2Data = function(response){
			return response;
		};
	};
	return Syncable;
});