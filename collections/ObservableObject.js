define([
	"compose/compose",
	'collections/dict',
	"./WithGetSet",
	"ksf/base/Evented",
	"./Observable",
	"./Bindable",
	"../base/Destroyable"
], function(
	compose,
	Dict,
	WithGetSet,
	Evented,
	Observable,
	Bindable,
	Destroyable
){

	var WithMapChanges = {
		toChanges: function(type){
			return this.map(function(item, key){
				return {type: type || "add", value: item, key: key};
			});
		},
	};

	var ObservableObject = compose(
		Evented,
		Observable,
		Bindable,
		Destroyable,
		WithMapChanges,
		WithGetSet,
		function() {
			this._store = new Dict();
		},
		{
			_Getter: function(prop){
				return this._store.get(prop);
			},
			_Setter: function(prop, value){
				this._store.set(prop, value);
			},
			_Detector: function(prop){
				return this._store.has(prop);
			},
			_Remover: function(prop){
				this._store.remove(prop);
			},
			forEach: function() {
				return this._store.forEach.apply(this, arguments);
			},
			map: function() {
				return this._store.map.apply(this, arguments);
			},
			add: function(value, prop) {
				this.set(prop, value);
			}
		}
	);

	return ObservableObject;
});