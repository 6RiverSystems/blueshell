import {Base} from '../nodes/Base';
import {BlueshellState} from '../nodes/BlueshellState';
import {resultCodes as rc} from '../../lib/utils/resultCodes';
import {Decorator} from '../nodes/Decorator';
import {Composite} from '../nodes/Composite';
import {Selector} from '../nodes/Selector';
import {LatchedSelector} from '../nodes/LatchedSelector';
import {Sequence} from '../nodes/Sequence';
import {LatchedSequence} from '../nodes/LatchedSequence';
import {IfElse} from '../nodes/IfElse';
import {RepeatWhen, Not, RepeatOnResult, ResultSwap} from '../nodes/decorators';

const NodeStyle = 'style=filled';

const DecoratorShape = 'shape=ellipse';
const CompositeShape = 'shape=diamond height=1';
const DefaultShape = 'shape=rectangle';

const SuccessColor = 'colorscheme=set14 fillcolor=3';
const FailureColor = 'colorscheme=set14 fillcolor=4';
const RunningColor = 'colorscheme=set14 fillcolor=2';
const ErrorColor = 'colorscheme=set14 fillcolor=1';
const DefaultColor = 'colorscheme=X11 fillcolor=gray90';

function getShape<S extends BlueshellState, E>(node: Base<S, E>): string {
	if (node instanceof Decorator) {
		return DecoratorShape;
	} else if (node instanceof Composite) {
		return CompositeShape;
	} else {
		return DefaultShape;
	}
}

function getColor<S extends BlueshellState, E>(node: Base<S, E>, state?: S): string {
	if (state) {
		const eventCounter = node!.getTreeEventCounter(state);
		const lastEventSeen = node!.getLastEventSeen(state);
		const lastResult = node!.getLastResult(state);

		if (lastEventSeen === eventCounter && lastResult) {
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
		}
	}
	return DefaultColor;
}

function getNodeId<S extends BlueshellState, E>(node: Base<S, E>): string {
	let id = node.name;
	if (id !== node.constructor.name) {
		id += '_' + node.constructor.name + '_';
	}
	return id;
}

function getLabel<S extends BlueshellState, E>(node: Base<S, E>): string {
	if (node.symbol) {
		return `label=<${node.name}<BR/><B>${node.symbol}</B>>`;
	} else {
		return `label=${node.name}`;
	}
}

export function serializeDotTree<S extends BlueshellState, E>(root: Base<S, E>, state?: S): any {
	if (!root) {
		return '';
	}

	const nodesToVisit: Base<S, E>[] = [];
	let resultingString = 'digraph G {\n';
	nodesToVisit.push(root);

	while (nodesToVisit.length) {
		const currentNode = nodesToVisit.pop();

		const nodeId = getNodeId(currentNode!);
		resultingString += `\t${nodeId} `;
		resultingString += `[${getLabel(currentNode!)} ${getShape(currentNode!)} `;
		resultingString += `${getColor(currentNode!, state)} ${NodeStyle}];\n`;

		if ((<any>currentNode).children) {
			for (const child of (<any>currentNode).children) {
				resultingString += `\t${nodeId} -> ${getNodeId(child)}\n`;
			}
			for (const child of [...(<any>currentNode).children].reverse()) {
				nodesToVisit.push(child);
			}
		}
	}

	resultingString += '}';

	return resultingString;
}
