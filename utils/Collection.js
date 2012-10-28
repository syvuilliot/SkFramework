define([
	"dojo/_base/declare",
	"dojo/Stateful",
	"dojo/Evented",
], function(declare, Stateful, Evented){

	/*
	A collection is a non ordered set of keys (or index) that point to a value (or not)
	It can contain the same value n times
	A key is always a string (TODO: allow for non string keys ?)
	It can be observed by:
	* registering events,
	* or via the watch method
	* or via aspect oriented programming
	A collection can propagate the events of its values. This is done by registering a listener on... on what ? how could this be done ?


	An ordered collection is an ordered set of keys
	It can be reordered via a "sort" method

	A sub collection is a dynamic collection created by a query method on a super collection.
	It cannot be changed directly but allow access to its super collection. Any change on a super collection is reflected on the sub collection.

	A set, can only contain a value once. This is done by identity (using getIdentity on the value if available or using the value directly otherwise)
	It can be observed by the same methods available for a collection plus:
	* the observe method

	*/
	
	function generateKey () {
		return Math.random().toString();
	}

	return declare([Evented], {
		constructor: function(items){
			this.items = {}; //TODO: use a Map instead of an object
			if(items){ //TODO: allow any iterable (array, object, map, set, ...)
				items.forEach(function(value, key){
					this.set(key, value);
				}.bind(this));
			}
		},

		//base methods
		addKey: function(key){
			//create a key if none is provided or if not already exists
			if (key === undefined){
				key = generateKey();
			}
			if (!this.has(key)){
				this.items[key]=undefined; //TODO: use Object.addOwnProperty instead
				this.emit("keyAdded", {key: key});
			}
			return key;
		},
		removeKey: function(key){
			delete this.items[key];
			this.emit("keyRemoved", {key: key});
		},
		setValue: function(key,value){
			this.items[key]=value;
			this.emit("valueSetted", {key: key, value: value});
		},
		getValue: function(key){
			return this.items[key];
		},

		//info
		has: function(key){
			return Object.keys(this.items).indexOf(key) !== -1;
		},
		length: function(){
			return Object.keys(this.items).length;
		},

		//helpers
		get: function(key){
			return this.getValue(key);
		},
		set: function(key, value){
			this.addKey(key);
			this.setValue(key, value);
		},
		add: function(value){
			var key = this.addKey();
			this.setValue(key, value);
			return key;
		},
		put: function (value) {
			return this.add(value);
		},
		remove: function(key){
			this.removeKey(key);
		},

		//querying
		query: function (query, option) {
			
		},

		//observing
		watch: function(prop, cb){
			var handler = this.on("valueSetted", function(ev){
				if(ev.key === prop){
					cb(ev.key, undefined, ev.value); //TODO: how to retrieve old value ?
				}
			});
			return {
				remove: function(){
					handler.remove();
				}
			};
		}

	});


});