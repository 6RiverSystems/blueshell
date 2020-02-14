import {v4} from 'uuid';

import {BlueshellState, rc, BaseNode, isParentNode} from '../models';
import {Decorator, IfElse} from '../nodes';

const DefaultStyle = 'style="filled,bold"';

const DecoratorShape = 'shape=ellipse';
const CompositeShape = 'shape=house height=1';
const IfElseShape = 'shape=diamond height=1';
const DefaultShape = 'shape=box';

const SuccessColor = 'fillcolor="#4daf4a"';
const FailureColor = 'fillcolor="#984ea3"';
const RunningColor = 'fillcolor="#377eb8"';
const ErrorColor = 'fillcolor="#e41a1c"';
const EnteredColor = 'fillcolor="#ff7f00"';
const DefaultColor = 'fillcolor="#e5e5e5"';

const DefaultEdgeColor ='color="#000000"';

function getShape<S extends BlueshellState, E>(node: BaseNode<S, E>): string {
	if (node instanceof Decorator) {
		return DecoratorShape;
	} else if (node instanceof IfElse) {
		return IfElseShape;
	} else if (isParentNode(node)) {
		return CompositeShape;
	} else {
		return '';
	}
}

function getColor<S extends BlueshellState, E>(node: BaseNode<S, E>, state?: S): string {
	if (state) {
		const eventCounter = node!.getTreeEventCounter(state);
		const lastEventSeen = node!.getLastEventSeen(state);
		const lastResult = node!.getLastResult(state);

		if (lastEventSeen === eventCounter) {
			if (lastResult) {
				switch (lastResult) {
				case rc.ERROR:
					return ErrorColor;
				case rc.SUCCESS:
					return SuccessColor;
				case rc.RUNNING:
					return RunningColor;
				case rc.FAILURE:
					return FailureColor;
				}
			} else {
				return EnteredColor;
			}
		}
	}
	return '';
}

function getNodeId<S extends BlueshellState, E>(node: BaseNode<S, E>): string {
	const nodeUnsafe: any = node;
	if (!nodeUnsafe.__nodeId) {
		nodeUnsafe.__nodeId = `n${v4().replace(/\-/g, '')}`;
	}
	return nodeUnsafe.__nodeId;
}

function getLabel<S extends BlueshellState, E>(node: BaseNode<S, E>): string {
	if (node.symbol) {
		return `label="${node.name}\\n${node.symbol}"`;
	} else {
		return `label="${node.name}"`;
	}
}

function getTooltip<S extends BlueshellState, E>(node: BaseNode<S, E>): string {
	return `tooltip="${node.constructor.name}"`;
}

export function serializeDotTree<S extends BlueshellState, E>(root: BaseNode<S, E>, state?: S): any {
	if (!root) {
		return '';
	}

	const nodesToVisit: BaseNode<S, E>[] = [];

	let resultingString = `digraph G {
	graph [ordering=out]
	node [${DefaultShape} ${DefaultColor} ${DefaultStyle}]
	edge [${DefaultEdgeColor}]
`;

	nodesToVisit.push(root);

	while (nodesToVisit.length) {
		const currentNode = nodesToVisit.pop();

		const nodeId = getNodeId(currentNode!);

		resultingString += `\t${nodeId} `;
		resultingString += `[${getLabel(currentNode!)} ${getShape(currentNode!)} ${getTooltip(currentNode!)}`;
		resultingString += ` ${getColor(currentNode!, state)}];\n`;

		if (!!currentNode && isParentNode(currentNode)) {
			resultingString = currentNode.getChildren().reduce(
				(acc: string, child: BaseNode<S, E>) => (`${acc}\t${nodeId}->${getNodeId(child)};\n`),
				resultingString);
			for (const child of [...currentNode.getChildren()].reverse()) {
				nodesToVisit.push(child);
			}
		}
	}

	resultingString += '}';

	return resultingString;
}
