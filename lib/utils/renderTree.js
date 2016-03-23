/**
 * Created by jpollak on 3/23/16.
 */
'use strict';

let archy = require('archy');

function buildArchyTree(tree) {

	let nodeName = tree.name;

	if (nodeName !== tree.constructor.name) {
		nodeName += ' (' + tree.constructor.name + ')';
	}

	let archyTree = {
		label: nodeName,
		nodes: []
	};

	if (tree.children) {
		for (let child of tree.children) {
			archyTree.nodes.push(buildArchyTree(child));
		}
	}

	return archyTree;
}


function renderTree(tree) {
	let a = buildArchyTree(tree);
	let renderedTree = archy(a);

	console.log(renderedTree);

	return renderedTree;
}

module.exports = renderTree;
