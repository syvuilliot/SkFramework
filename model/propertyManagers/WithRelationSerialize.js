define([

], function(

){
	return function(args){
		this.serialize = function(rsc){
			return args.manager.getPropValue(rsc, "syncId");
		};
		this.deserialize = function(id){
			// ce n'est pas au resource manager d'être lazy, car le cas dans lequel on souhaite être lazy, c'est celui de la résolution d'id, donc on le fait ici
			var rsc = args.manager.getBy("syncId", id) || args.manager.create({
				syncId: id,
			});
			return rsc;
		};
		this.serializePropName = args.serializePropName;
		return this;
	};
});