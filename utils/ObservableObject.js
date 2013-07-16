define([
	"compose/compose",
	"./WithGetSet",
	"./Evented",
	"./Observable",
	"./Bindable",
], function(
	compose,
	WithGetSet,
	Evented,
	Observable,
	Bindable
){
	var WithDefaultGetterSetter = {
		_Getter: function(prop){
			return this[prop];
		},
		_Setter: function(prop, value){
			this[prop] = value;
		},
		_Detector: function(prop){
			return this.hasOwnProperty(prop);
		},
		_Remover: function(prop){
			delete this[prop];
		},
	};

	var ObservableObject = compose(
		compose,
		WithGetSet,
		Evented,
		WithDefaultGetterSetter,
		Observable,
		Bindable
	);

	return ObservableObject;
});