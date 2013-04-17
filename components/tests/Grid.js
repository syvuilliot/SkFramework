define([
	'teststack!object',	'teststack/chai!assert',
	"../Grid",
	"frb/bind",
	"ksf/utils/frb-dom",
], function(
	registerSuite, assert,
	Grid,
	bind
){

	var grid = window.grid = new Grid({
	});
	document.body.appendChild(grid.domNode);

	var syv = window.syv = {name: "Sylvain", age: 31, sexe: "M"};
	var aur = window.aur = {name: "Aurélie", age: 30, sexe:"F"};
	var ant = window.ant = {name: "Antonin", age: 2, sexe:"M"};
	var leo = window.leo = {name: "Léonie", age: 0, sexe:"F"};
	var collection = window.collection = [syv, aur, ant];


	grid.value = collection;

	var DivRenderer = function(prop){
		var cancel;
		return {
			create: function(item){
				var cmp = document.createElement("input");
				cancel = bind(cmp, "value", {
					"<->": prop,
					source: item,
				});
				return cmp;
			},
			destroy: function(input){
				cancel();
			},
			place: function(input, td){
				td.appendChild(input);
			},
			unplace: function(input, td){
				td.removeChild(input);
			},
		};
	};

	var config = window.config = [
		{title: "Nom", renderer: DivRenderer("name")},
		{title: "Sexe", renderer: DivRenderer("sexe")},
	];
	grid.config = config;

	// add column
	// config.push({label: "Age", property: "age"});

	// add row
	collection.push(leo);

	// sort collection
	// collection.reverse();

	// sort columns
	// config.reverse();

	// select via a click

	// select programatically

});