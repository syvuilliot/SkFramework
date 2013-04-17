define([
	'ksf/utils/constructor',
	'ksf/utils/binding',
], function(
	ctr,
	binding
){
	var renderer = {
		create: function(value, index){
			var div = document.createElement("div");
			div.innerHTML = value;
			return div;
		},
		destroy: function(cmp, index){
		},
		place: function(cmp, container, index){
			container.insertBefore(cmp, container.children[index]);
		},
		unplace: function(cmp, container, index){
			container.removeChild(cmp);
		},
	};


	return ctr(function CollectionRenderer(args){
		// all properties are non enumerable (like on an array object) so they are not considered as items contained in this by frb
		// only collection can be changed after creation (not container nor renderer)
		Object.defineProperties(this, {
			container: {value: args && args.container || document.createElement("div")},
			collection: {value: args && args.collection, configurable: true, writable: true},
			_renderer: {value: args && args.renderer || renderer},
			_components: {value: []},
			_cancelBinding: {writable: true},
		});
		this._binding = new binding.ReactiveMapping(this, this, {sourceProp: "collection"});

	}, {
		add: function(value, index){
			var cmp = this._renderer.create(value, index);
			this._components.splice(index, 0, cmp);
			this._renderer.place(cmp, this.container, index); // même signature que domConstruct.place
		},
		remove: function(value, index){
			var cmp = this._components.splice(index, 1)[0];
			this._renderer.unplace(cmp, this.container, index);
			this._renderer.destroy(cmp, index);
		},
		destroy: function(){
			this._binding.remove();
			while(this._components.length){
				this.remove(undefined, 0);
			}
			// ce n'est pas au CollectionRenderer de détruire le renderer qu'on lui a fourni... car on ne sait pas comment le faire et surtout il peut être utilisé ailleur. C'est bien au propriétaire du renderer de le détruire si besoin en même temps qu'il détruit le CollectionRenderer.
		},
	});

});