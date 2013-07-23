define([
	"compose/compose",
	'collections/dict',
	"./WithGetSet",
	"./Evented",
	"./Observable",
	"./Bindable",
	"./Destroyable"
], function(
	compose,
	Dict,
	WithGetSet,
	Evented,
	Observable,
	Bindable,
	Destroyable
){
	var WithDefaultGetterSetter = {
		_Getter: function(prop){
			return this._props.get(prop);
		},
		_Setter: function(prop, value){
			this._props.set(prop, value);
		},
		_Detector: function(prop){
			return this._props.has(prop);
		},
		_Remover: function(prop){
			this._props.remove(prop);
		},
		forEach: function(cb, scope) {
			this._props.forEach(cb, scope);
		}
	};

	var ObservableObject = compose(
		WithGetSet,
		Evented,
		function() {
			this._props = new Dict();
		},
		WithDefaultGetterSetter,
		Observable,
		Bindable,
		Destroyable
	);

	return ObservableObject;
});