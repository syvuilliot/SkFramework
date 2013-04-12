define([
	'ksf/utils/constructor',
	'frb/bind',
], function(
	ctr,
	bind
){
	var renderer = {
		create: function(value){
			var div = document.createElement("div");
			div.innerHTML = value;
			return div;
		},
		destroy: function(cmp){
			cmp.destroy && cmp.destroy();
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
		this._cancelBinding = bind(this, "rangeContent()", {"<-": "collection"});

	}, {
		swap: function(position, removed, added){
			// console.log("swap called", arguments);
			this._components.splice(position, removed).forEach(function(cmp){
				this._renderer.unplace(cmp, this.container, position);
				this._renderer.destroy(cmp);
			}, this);
			var cmp;
			added.forEach(function(value, index){
				cmp = this._renderer.create(value);
				this._components.splice(position+index, 0, cmp);
				this._renderer.place(cmp, this.container, position+index); // même signature que domConstruct.place
			}, this);
		},
		clear: function(){
			// console.log("clear called", arguments);
			// I don't know why this function is called but it is mandatory so I redirect it to "_components"
			return this._components.clear.apply(this._components, arguments);
		},
		// frb need a way to know how many values are contained in this in order to remove them when a new collection is setted
		// it uses Array.from which delegate to array.addEach which uses "forEach" if available
		forEach: function () {
			return this._components.forEach.apply(this._components, arguments);
		},
		destroy: function(){
			this._cancelBinding();
			// ce n'est pas au CollectionRenderer de détruire le renderer qu'on lui a fourni... car on ne sait pas comment le faire et surtout il peut être utilisé ailleur. C'est bien au propriétaire du renderer de le détruire si besoin en même temps qu'il détruit le CollectionRenderer.
		},
	});

});