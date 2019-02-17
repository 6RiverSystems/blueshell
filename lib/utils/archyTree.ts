import {Base} from '../nodes/Base';
import {BlueshellState} from '../nodes/BlueshellState';

import * as archy from 'archy';
import {Data} from 'archy';

function buildArchyTree<S extends BlueshellState, E>(node: Base<S, E>, state?: S): Data {
	let nodeLabel = node.name;

	if (nodeLabel !== node.constructor.name) {
		nodeLabel += ' (' + node.constructor.name + ')';
	}

	if (state) {
		const eventCounter = node.getTreeEventCounter(state);
		const lastEventSeen = node.getLastEventSeen(state);
		const lastResult = node.getLastResult(state);

		if (lastEventSeen === eventCounter && lastResult) {
			nodeLabel += ' => ' + lastResult;
		}
	}

	const nodes = [];

	if ((<any>node).children) {
		for (const child of (<any>node).children) {
			const subTree = buildArchyTree(<Base<S, E>>child, state);
			nodes.push(subTree);
		}
	}

	return {
		label: nodeLabel,
		nodes,
	};
}

export function serializeArchyTree<S extends BlueshellState, E>(tree: Base<S, E>, state?: S): string {
	const archyTree = buildArchyTree(tree, state);
	return archy(archyTree);
}
