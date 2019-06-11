/**
 * Created by jpollak on 3/23/16.
 */
'use strict';

import * as archy from 'archy';

import {Base} from '../nodes/Base';
import {ResultCodes} from './ResultCodes';
import {Composite} from '../nodes/composites/Composite';
import {serializeDotTree} from './dotTree';

class ArchyTree {
	label: string;
	nodes: ArchyTree[] = [];
}

function buildArchyTree(node: Base<any>, state: any): ArchyTree {

	let nodeLabel = node.name;

	if (nodeLabel !== node.constructor.name) {
		nodeLabel += ' (' + node.constructor.name + ')';
	}

	if (state) {
		let lastResult = node.getLastResult(state);

		nodeLabel += ' => ' + ResultCodes[lastResult];
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

export function renderTree(tree: Base<any>, state?: any) {
	let a = buildArchyTree(tree, state);
	let renderedTree = archy(a);

	return renderedTree;
}

export function toConsole(tree: Base<any>, state?: any) {
	console.log(renderTree(tree, state)); // eslint-disable-line no-console
}

export function toDotString(tree: Base<any>, state?: any) {
	return serializeDotTree(tree, state);
}