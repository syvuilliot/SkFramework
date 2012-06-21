define([
	"dojo/_base/lang",	"dojo/_base/declare",
	"dojo/aspect"
], function(
	lang,				declare,
	aspect
){
	return declare(null, {
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
		query: function(query, options){
			var defered = this.remote.query(query, options);
			defered.forEach(function(item) {
				this.local.put(item, {silent: true});
			}.bind(this));
		}
	});
});