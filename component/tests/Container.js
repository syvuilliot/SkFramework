define([
	'doh/runner',
	'dojo/_base/declare',
	'../DomComponent',	'../_Container'
],
function(
	doh,
	declare,
	DomComponent,		Container
){
    doh.register("Testing Dom-components", [
      	{
	        name: "DOM-component",
	        setUp: function(){
	          	this.main = new declare([DomComponent, Container])();
	          	this.sub1 = new DomComponent({
          			domTag: 'h1',
	          		domAttrs: {
	          			innerHTML: "Sub1"
	          		}
	          	});
	          	this.main.addChildren([
	          		this.sub1
	          	]);
	          	this.main.render();
	        },
	        runTest: function() {
	          	// Insert into the DOM
	          	this.main.set('inDom');
	          	doh.t(this.sub1.get('inDom'), "1. sub1 in DOM");
	          	doh.t(this.sub1.domNode, "sub1 rendered");
	        }
      	}
    ]);
});