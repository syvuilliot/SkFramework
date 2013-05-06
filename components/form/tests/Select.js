define([
	'intern!object',	'intern/chai!assert',
	"../Select",
	"collections/listen/property-changes",
], function(
	registerSuite, assert,
	Select,
	PropertyChanges
){
	var syv = window.syv = {id: "syv", name: "Sylvain", age: 31, sexe: "M"};
	var aur = window.aur = {id: "aur", name: "Aurélie", age: 30, sexe:"F"};
	var ant = window.ant = {id: "ant", name: "Antonin", age: 2, sexe:"M"};
	var leo = window.leo = {id: "leo", name: "Léonie", age: 1, sexe:"F"};
	var collection = window.collection = [syv, aur, ant];


	var select = window.select = new Select({
		valueProp: "id",
		labelProp: "name",
		options: collection,
		value: "aur",
	});

	PropertyChanges.addOwnPropertyChangeListener(select, "value", function(){
		console.log("select value cahnged to", arguments);
	});
	document.body.appendChild(select.domNode);


});