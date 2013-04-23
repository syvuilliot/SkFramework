define([
	'teststack!object',	'teststack/chai!assert',
	"../List",
	"frb/bind",
	"frb/observe",
	"collections/sorted-array",
	"ksf/utils/frb-dom",
], function(
	registerSuite, assert,
	List,
	bind,
	observe,
	SortedArray
){
	// create css rules
	var css = document.createElement("style");
	css.type = "text/css";
	document.head.appendChild(css);
	css.sheet.insertRule('.active { background-color: red; }', css.sheet.cssRules.length);
	css.sheet.insertRule('.selected { background-color: blue; }', css.sheet.cssRules.length);

	var list = window.list = new List({
		domTag: "ul",
		factory: {
			create: function (item) {
				var li = document.createElement("li");
				li.innerHTML = item.name;
				return li;
			},
			destroy: function(){},
		},
	});
	document.body.appendChild(list.domNode);

	var syv = window.syv = {name: "Sylvain", age: 31, sexe: "M"};
	var aur = window.aur = {name: "Aurélie", age: 30, sexe:"F"};
	var ant = window.ant = {name: "Antonin", age: 2, sexe:"M"};
	var leo = window.leo = {name: "Léonie", age: 1, sexe:"F"};
	var collection = window.collection = [syv, aur, ant];


	list.value = collection;


});