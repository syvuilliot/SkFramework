define([
	'ksf/utils/constructor',
	'frb/bind',
], function(
	ctr,
	bind
){

	var creator = function(value){
		var div = document.createElement("div");
		div.innerHTML = value;
		return div;
	};
	var destructor = function(cmp){
		cmp.destroy && cmp.destroy();
	};
	var placer = function(cmp, container, index){
		container.insertBefore(cmp, container.children[index]);
	};
	var unplacer = function(cmp, container){
		container.removeChild(cmp);
	};


	return ctr(function Repeater(args){
		// all properties are non enumerable (like on an array object) so they are not considered as items contained in this
		Object.defineProperties(this, {
			container: {value: args && args.container || document.createElement("div")},
			_create: {value: args && args.create || creator},
			_destroy: {value: args && args.destroy || destructor},
			_place: {value: args && args.place || placer},
			_unplace: {value: args && args.unplace || unplacer},
			components: {value: []},
			collection: {value: args && args.collection, configurable: true, writable: true},
			_cancelBinding: {writable: true},
		});
		this._cancelBinding = bind(this, ".rangeContent()", {"<-": "collection"});

	}, {
		swap: function(position, removed, added){
			// console.log("swap called", arguments);
			this.components.splice(position, removed).forEach(function(cmp){
				this._unplace(cmp, this.container, position);
				this._destroy(cmp);
			}, this);
			var cmp;
			added.forEach(function(value, index){
				cmp = this._create(value);
				this.components.splice(position+index, 0, cmp);
				this._place(cmp, this.container, position+index);
			}, this);
		},
		clear: function(){
			// console.log("clear called", arguments);
			// I don't know why this function is called but it is mandatory so I redirect it to "components"
			return this.components.clear.apply(this.components, arguments);
		},
		// frb need a way to know how many values are contained in this in order to remove them when a new collection is setted
		// it uses Array.from which delegate to array.addEach which uses "forEach" if available
		forEach: function () {
			return this.components.forEach.apply(this.components, arguments);
		},
		destroy: function(){
			this._cancelBinding();
		},
	});

});