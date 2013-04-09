define([
	"ksf/utils/constructor",
	"dojo/aspect",
], function(
	ctr,
	aspect
){
	return ctr(function NameManager(args){
		this._registry = args.registry;
		this.actionner = args.actionner;
		this._observers = {};
		// bind to registry : when a component is created set its name
		this._observers.registryAdd = aspect.after(this._registry, "add", function(cmp, id){
			this.actionner.execute(cmp, id);
		}.bind(this), true);


	}, {
		destroy: function(){
			this._observers.registryAdd.cancel();
		}
	});
});