define([
	'dojo/_base/declare',	'dijit/_WidgetBase',
], function(
	declare,				_WidgetBase
) {
	var isDijitLayout = function(elmt) {
		return elmt.addChild && elmt.startup;
	};
	var isDom = function(elmt) {
		return elmt instanceof HTMLElement;
	}

	return declare([], {
		put: function(child, parent, options) {
			if (isDom(child) && isDijitLayout(parent)) {
				var wrappedChild = new (declare([_WidgetBase], {
					constructor: function() {
						this.domNode = child;
					}
				}))(options);
				child._dijitWrap = wrappedChild;
				parent.addChild(wrappedChild);
				return true;
			}
		},
		set: function(child, parent, options) {
			if (isDom(child) && isDijitLayout(parent)) {
				child._dijitWrap.set(options);
				parent.layout();
			}
		}
	});
});