/**
 * Created by jpollak on 3/23/16.
 */
'use strict';

import * as archy from 'archy';

import {Base} from '../nodes/Base';
import {ResultCodes} from './ResultCodes';

class ArchyTree {
	label: string;
	nodes: ArchyTree[] = [];
};

function buildArchyTree(node: Base, state: any): ArchyTree {

	let nodeLabel = node.name;

	if (nodeLabel !== node.constructor.name) {
		nodeLabel += ' (' + node.constructor.name + ')';
	}

	if (state) {
		let eventCounter = node.getTreeEventCounter(state);
		let lastEventSeen = node.getLastEventSeen(state);
		let lastResult = node.getLastResult(state);

		if (lastEventSeen === eventCounter && lastResult) {
			nodeLabel += ' => ' + ResultCodes[lastResult];
		}

	}

	let archyTree = new ArchyTree();

	archyTree.label = nodeLabel;

	if (node.children) {
		for (let child of node.children) {
			archyTree.nodes.push(buildArchyTree(child, state));
		}
	}

	return archyTree;
}

export function renderTree(tree: Base, state?: any) {
	let a = buildArchyTree(tree, state);
	let renderedTree = archy(a);

	return renderedTree;
}

export function toConsole(tree: Base, state?: any) {
	console.log(renderTree(tree, state)); // eslint-disable-line no-console
}