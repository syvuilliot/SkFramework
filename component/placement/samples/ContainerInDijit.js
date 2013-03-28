define([
	'dojo/_base/declare',	'dijit/_WidgetBase'
], function(
	declare,				_WidgetBase
) {
	var isDijitLayout = function(elmt) {
		return elmt.addChild && elmt.startup;
	};
	var isContainer = function(elmt) {
		return elmt.root instanceof HTMLElement;
	}

	return declare([], {
		put: function(child, parent, options) {
			if (isContainer(child) && isDijitLayout(parent)) {
				var wrappedChild = new (declare([_WidgetBase], {
					constructor: function() {
						this.domNode = child.root;
					},
					resize: function(dims) {
						child.root.style.width = dims.w + 'px';
						child.height = dims.h;
					}
				}))(options);
				child._dijitWrap = wrappedChild;
				parent.addChild(wrappedChild);
				return true;
			}
		},
		set: function(child, parent, options) {
			if (isContainer(child) && isDijitLayout(parent)) {
				child._dijitWrap.set(options);
				parent.layout();
			}
		},
		remove: function(child, parent, options) {
			if (isContainer(child) && isDijitLayout(parent)) {
				parent.removeChild(child._dijitWrap);
			}
		}
	});
});