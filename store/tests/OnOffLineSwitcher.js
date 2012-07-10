define([
	"doh/runner",
	"../OnOffLineSwitcher",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/store/Memory",
], function(doh, Switcher, declare, lang, Memory){

	window.onLineStore = new Memory();
	window.offLineStore = new Memory();
	window.store = Switcher(onLineStore, offLineStore, {
		onLine: function(){
			return window.onLine;
		}
	});
	
	var toto = {id: "1", name: "toto"};
	var titi = {id: "2", name: "titi"};

	doh.register("Unit tests", {
		"on line": function(t){
			window.onLine = true;
			store.put(toto);
			t.is(toto, store.get("1"));
			t.is(undefined, store.get("2"));
		},
		"off line": function(t){
			window.onLine = false;
			store.put(titi);
			t.is(titi, store.get("2"));
			t.is(undefined, store.get("1"));
		},
	});
	
});
