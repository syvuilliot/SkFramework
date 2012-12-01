define([
	'doh/runner',
	'../DomComponent'
],
function(
	doh,
	DomComponent
){
    doh.register("Testing Dom-components", [
      	{
	        name: "DOM-component",
	        setUp: function(){
	          	this.main = new DomComponent();
	          	this.sub1 = new DomComponent({
          			domTag: 'h1',
	          		domAttrs: {
	          			innerHTML: "Sub1"
	          		}
	          	});
	          	this.sub2 = new DomComponent({
          			domTag: 'h2',
	          		domAttrs: {
	          			innerHTML: "Sub2"
	          		}
	          	});
	          	this.main._addComponents({
	          		sub1: this.sub1,
	          		sub2: this.sub2
	          	});
	          	this.main._placeComponents(['sub1', this.sub2]);
	        },
	        runTest: function() {
	          	doh.is(this.main.get('inDom'), false);
	          	doh.f(this.main.domNode, "main not rendered yet");
	          	this.main.render();
	          	doh.t(this.main.domNode, "main rendered");
	          	// Insert into the DOM
	          	this.main.set('inDom');
	          	doh.t(this.main.get('inDom'), "1. main in DOM");
	          	doh.t(this.sub1.get('inDom'), "1. sub1 in DOM");
	          	doh.t(this.sub1.domNode, "sub1 rendered");
	          	doh.t(this.sub2.domNode, "sub2 rendered");
	          	doh.is(this.sub1.domNode.tagName, 'H1', "correct tag for sub1");
	          	doh.is(this.sub1.domNode.innerHTML, "Sub1", "correct attributes for sub1");
	          	// Remove from the DOM
	          	this.main.set('inDom', false);
	          	doh.f(this.main.get('inDom'), "2. main out of DOM");
	          	doh.f(this.sub1.get('inDom'), "2. sub1 out of DOM");
	          	doh.f(this.sub2.get('inDom'), "2. sub2 out of DOM");
	          	// Insert into the DOM again
	          	this.main.set('inDom');
	          	doh.t(this.main.get('inDom'), "3. main in DOM again");
	          	doh.t(this.sub1.get('inDom'), "3. sub1 in DOM again");
	          	doh.t(this.sub2.get('inDom'), "3. sub2 in DOM again");
	        }
      	}
    ]);
});