define([
	"../Grid",
	"dojo/_base/declare",
	"../../../component/DomComponent",
	"frb/bind",
	"../../form/Input"
], function(Grid, declare, DomComponent, bind, Input){

	window.grid = new Grid({
	});
	document.body.appendChild(grid.render());
	grid.set('inDom');

	syv = {name: "Sylvain", age: 31, sexe: "M"};
	aur = {name: "Aurélie", age: 30, sexe:"F"};
	ant = {name: "Antonin", age: 2, sexe:"M"};
	leo = {name: "Léonie", age: 0, sexe:"F"};
	collection = [syv, aur, ant];


	grid.set("value", collection);
	config = [
		{label: "Nom", property: "name", renderer: Input},
		{label: "Sexe", property: "sexe"}
	];
	grid.set("config", config);

	// add column
	config.push({label: "Age", property: "age"});

	// add row
	collection.push(leo);

	// sort collection
	// collection.reverse();

	// sort columns
	// config.reverse();

	// select via a click

	// select programatically

});