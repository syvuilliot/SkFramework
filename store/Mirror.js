define([
	"dojo/_base/lang",
	"dojo/_base/declare",
	"dojo/aspect",
	"dojo/when",
], function(lang, declare, aspect, when){
	var Sync = declare(null, {
		constructor: function(params){
			lang.mixin(this, params);
			aspect.after(this.local, "put", this.put.bind(this), true);
			aspect.after(this.local, "query", this.query.bind(this), true);
		},
		put: function(object, options){
			if (!options || !options.silent) {
				this.remote.put(object, options);
			}
		},
		query:  function(query, options){
			var defered = this.remote.query(query, options);
			when(defered, function(result){
				result.forEach(function(item){
					this.local.put(item, {silent: true});
				}.bind(this));
			}.bind(this));
		},

	});
	return Sync;
});