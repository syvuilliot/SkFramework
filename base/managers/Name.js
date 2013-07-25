define([
	"ksf/utils/constructor",
	"dojo/aspect"
], function(
	ctr,
	aspect
){
	return ctr(function NameManager(args){
		this._registry = args.registry;
		this.actionner = args.actionner;
		this.convertFn = args.convert || function(a) { return a; };
		this._observers = {};
		// bind to registry : when a component is created set its name
		this._observers.registryAdd = this._registry.on("added", function(ev){
			var id = ev.key;
			var cmp = ev.value;
			if (typeof id === 'string') {
				this.actionner.execute(cmp, this.convertFn(id));
			}
		}.bind(this), true);


	}, {
		destroy: function(){
			this._observers.registryAdd.cancel();
		}
	});
});