/**
 * Created by jpollak on 3/23/16.
 */
'use strict';

import * as archy from 'archy';

import {Action} from '../nodes/actions/Action';
import {ResultCodes} from './ResultCodes';
import {Composite} from '../nodes/Composite';

class ArchyTree {
	label: string;
	nodes: ArchyTree[] = [];
}

function buildArchyTree(node: Action<any>, state: any): ArchyTree {

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

	if (node instanceof Composite) {
		const compositeNode = <Composite<any>>node;

		for (let child of compositeNode.children) {
			archyTree.nodes.push(buildArchyTree(child, state));
		}
	}

	return archyTree;
}

export function renderTree(tree: Action<any>, state?: any) {
	let a = buildArchyTree(tree, state);
	let renderedTree = archy(a);

	return renderedTree;
}

export function toConsole(tree: Action<any>, state?: any) {
	console.log(renderTree(tree, state)); // eslint-disable-line no-console
}
