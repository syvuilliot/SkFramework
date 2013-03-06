define([
	'doh/runner',
	'../DomComponent',	'../Container'
],
function(
	doh,
	DomComponent,		Container
){
	doh.register("Testing containers (DOM-components)", [
		{
			name: "Container",
			setUp: function(){
				this.main = new Container();
				this.sub1 = new DomComponent({
					domTag: 'h1',
					domAttrs: {
						innerHTML: "Sub1"
					}
				});
				this.main.addChildren([
					this.sub1
				]);
				// this.main.render();
			},
			runTest: function() {
				// Insert into the DOM
				this.main.inDom = true;
				doh.t(this.sub1.inDom, "1. sub1 in DOM");
				doh.t(this.sub1.domNode, "sub1 rendered");
				// Remove child
				this.main.removeChildren([
					this.sub1
				]);
				doh.f(this.sub1.inDom, "2. sub1 not in DOM");
				// Place it again
				this.main.addChild(this.sub1);
				doh.t(this.sub1.inDom, "3. sub1 in DOM again");
			}
		}
	]);
});