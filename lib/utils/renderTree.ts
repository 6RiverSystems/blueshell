/**
 * Created by jpollak on 3/23/16.
 */
import {Base} from '../nodes/Base';
import {BlueshellState} from '../nodes/BlueshellState';

import * as archy from 'archy';
import {Data} from 'archy';
import * as _ from 'lodash';
import { Selector } from '../nodes/Selector';
import { LatchedSelector } from '../nodes/LatchedSelector';
import { LatchedSequence } from '../nodes/LatchedSequence';
import {Sequence} from '../nodes/Sequence';
import { IfElse } from '../nodes/IfElse';
import {Not, RepeatOnResult, RepeatWhen, ResultSwap} from '../nodes/decorators';

function buildArchyTree<S extends BlueshellState, E>(node: Base<S, E>, state?: S): Data {

	let nodeLabel = node.name;

	if (nodeLabel !== node.constructor.name) {
		nodeLabel += ' (' + node.constructor.name + ')';
	}

	if (state) {
		let eventCounter = node.getTreeEventCounter(state);
		let lastEventSeen = node.getLastEventSeen(state);
		let lastResult = node.getLastResult(state);

		if (lastEventSeen === eventCounter && lastResult) {
			nodeLabel += ' => ' + lastResult;
		}

	}

	const archyTree = {
		label: nodeLabel,
		nodes: new Array<Data | string>(),
	};

	if ((<any>node).children) {
		for (let child of (<any>node).children) {
			archyTree.nodes.push(buildArchyTree(<Base<S,E>>child, state));
		}
	}

	return archyTree;
}

function iterativePreOrderTraversal<S extends BlueshellState, E>(root: Base<S, E>, visit: (node: Base<S, E>, state?: S) => any, state?: S): any {
	if(!root) {
		return;
	}

	let nodesToVisit: Base<S, E>[] = [];
	let resultingString = '';
	nodesToVisit.push(root);

	while(!_.isEmpty(nodesToVisit)) {
		let currentNode = nodesToVisit.pop();
		resultingString += visit(currentNode!, state);

		if((<any>currentNode).children) {
			for (let child of [...(<any>currentNode).children].reverse()) {
				nodesToVisit.push(child);
			}
		}
	}

	return resultingString;
}

function nodeInDotLanguage<S extends BlueshellState, E>(node: Base<S, E>, state?: S): string {
	let shape;

	if(node instanceof LatchedSelector) {
		shape = 'Mdiamond';
	} else if (node instanceof Selector) {
		shape = 'diamond';
	} else if (node instanceof LatchedSequence) {
		shape = 'doubleoctagon';
	} else if (node instanceof Sequence) {
		shape = 'octagon';
	} else if (node instanceof IfElse) {
		shape = 'invtriangle';
	} else if (node instanceof Not) {
		shape = 'circle';
	} else if (node instanceof RepeatOnResult) {
		shape = 'house';
	} else if (node instanceof RepeatWhen) {
		shape = 'invhouse';
	} else if (node instanceof ResultSwap) {
		shape = 'egg';
	} else {
		shape = 'rectangle';
	}

	let nodeLabel = node.name;

	if (nodeLabel !== node.constructor.name) {
		nodeLabel += ' (' + node.constructor.name + ')';
	}

	return `\t${nodeLabel} [shape=${shape}];\n`;
}

export function generateDigraphString<S extends BlueshellState, E>(tree: Base<S, E>, state?: S): string {
	let digraphString = `digraph G {
${iterativePreOrderTraversal(tree, nodeInDotLanguage, state)}
}`;
	return digraphString;
}

export function toString<S extends BlueshellState, E>(tree: Base<S, E>, state?: S): string {
	let a = buildArchyTree(tree, state);
	let renderedTree = archy(a);

	return renderedTree;
}

export function toConsole<S extends BlueshellState, E>(tree: Base<S, E>, state?: S) {
	console.log(toString(tree, state)); // eslint-disable-line no-console
}
