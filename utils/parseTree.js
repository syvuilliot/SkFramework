define([
	'dojo/_base/lang'
], function(
	lang
) {
	function isTree(item) {
		return lang.isArray(item) && item.length == 2 && lang.isArray(item[1]);
	}

	var parseTree = function(tree, callback) {
		if (isTree(tree)) {
			tree[1].forEach(function(item) {
				if (isTree(item)) {
					callback(item[0], tree[0]);
					parseTree(item, callback);
				} else {
					callback(item, tree[0]);
				}
			});
		} else {
			throw "Argument is not a tree";
		}
	};
	return parseTree;
})