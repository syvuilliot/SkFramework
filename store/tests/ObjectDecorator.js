define([
	'doh/runner',
	'dojo/_base/declare',
	'dojo/Stateful',	'dojo/store/Memory',
	'../ObjectDecorator'
],
function(
	doh,
	declare,
	Stateful,			Memory,
	StoreDecorator
){
    doh.register("Testing object decorator store", [
      	{
	        name: "Wrapping store",
	        setUp: function() {
	          	this.source = new Memory();
	          	this.wrap = StoreDecorator(this.source, {
	          		selected: false
	          	});
	        },
	        runTest: function() {
	        	var joe = new Stateful({
	        		id: 1,
	        		name: "Joe"
	        	});
	        	var jack = new Stateful({
	        		id: 2,
	        		name: "Jack"
	        	});
	        	this.source.put(joe);
	        	this.source.put(jack);
	        	var wrappedJoe = this.wrap.get(1);
	        	doh.is(wrappedJoe.get('name'), "Joe", "Source object accessible from wrap");
	        	doh.is(wrappedJoe.get('selected'), false, "Extra property has been added");
	        	var wrappedJoeQuery = this.wrap.query({name: "Joe"});
	        	doh.is(wrappedJoeQuery.length, 1, "Can query wrap store on source property (1)");
	        	doh.is(wrappedJoeQuery[0], wrappedJoe, "Can query wrap store on source property (2)");
	        	var wrappedJack = this.wrap.get(2).set('selected', true);
	        	this.wrap.put(wrappedJack);
	        	wrappedSelectedQuery = this.wrap.query({selected: true});
	        	doh.is(wrappedSelectedQuery.length, 1, "Can query wrap store on extra property (1)");
	        	doh.is(wrappedSelectedQuery[0], wrappedJack, "Can query wrap store on extra property (2)");
	        }
      	}
    ]);
});