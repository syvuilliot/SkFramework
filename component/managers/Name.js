define([
	"ksf/utils/constructor",
	"dojo/aspect",
	'ksf/utils/string'
], function(
	ctr,
	aspect,
	str
){
	return ctr(function NameManager(args){
		this._registry = args.registry;
		this.actionner = args.actionner;
		this._observers = {};
		// bind to registry : when a component is created set its name
		this._observers.registryAdd = this._registry.on("added", function(ev){
			var id = ev.key;
			var cmp = ev.value;
			if (id) {
				this.actionner.execute(cmp, str.hyphenate(id));
			}
		}.bind(this), true);


	}, {
		destroy: function(){
			this._observers.registryAdd.cancel();
		}
	});
});