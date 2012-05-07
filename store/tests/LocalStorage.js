define([
	"doh/runner",
	"SkFramework/store/LocalStorage",
], function(doh, LocalStorage){
	var ls = new LocalStorage();
	doh.register("LocalStorage", [
		function stringId(t){
			var toto = {id: "10", name:"toto"};
			ls.put(toto);
			t.is(ls.get("10"), toto, "on récupère bien l'objet");
		},
		function integerId(t){
			var toto = {id: 10, name:"toto"};
			ls.put(toto);
			t.is(ls.get(10), toto, "on récupère bien l'objet");
		},
		function decimalId(t){
			var toto = {id: 10.5, name:"toto"};
			ls.put(toto);
			t.is(ls.get(10.5), toto, "on récupère bien l'objet");
		},
		{
			name:"query",
			setUp: function(t){
				ls.put({id: "20", name:"titi"});
			},
			runTest: function(t){
				var qr = ls.query({name: "titi"});
				t.t(qr.total == 1);
			},
		},
		function objectWithoutId(t){
			var item = {foo: "bar"};
			var ret = ls.put(item);
			t.t(ret);//ret is not undefined
			console.log("le retour est", ret);
			var storedItem = ls.get(ret);
			console.log("storedItem", storedItem);
			t.is(item, storedItem);//we get back the item by its id. Be careful: storedItem has an 'id' property that item doesn't have... but the test is successfull nevertheless
		},
	]);
});