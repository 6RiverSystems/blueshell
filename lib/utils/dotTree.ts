import {Base} from '../nodes/Base';
import {ResultCodes as rc} from './ResultCodes';
import {Decorator} from '../nodes/decorators/Decorator';
import {Composite} from '../nodes/composites/Composite';

import {v4} from 'uuid';

const DefaultStyle = 'style="filled,bold"';

const DecoratorShape = 'shape=ellipse';
const CompositeShape = 'shape=diamond height=1';
const DefaultShape = 'shape=box';

export const SuccessColor = 'fillcolor="#4daf4a"';
export const FailureColor = 'fillcolor="#984ea3"';
export const RunningColor = 'fillcolor="#377eb8"';
export const ErrorColor = 'fillcolor="#e41a1c"';
export const DefaultColor = 'fillcolor="#e5e5e5"';

const DefaultEdgeColor ='color="#000000"';

function getHeader() {
	return `digraph G {
		node [${DefaultShape} ${DefaultColor} ${DefaultStyle}]
		edge [${DefaultEdgeColor}]
	`;
}

function getFooter() {
	return '}';
}

function getShape<S>(node: Base<S>): string {
	if (node instanceof Decorator) {
		return DecoratorShape;
	} else if (node instanceof Composite) {
		return CompositeShape;
	} else {
		return '';
	}
}

export function getColor<S>(node: Base<S>, state?: S): string {
	if (state) {
		const eventCounter = node!.getTreeEventCounter(state);
		const lastEventSeen = node!.getLastEventSeen(state);
		const lastResult = node!.getLastResult(state);

		if (lastEventSeen === eventCounter) {
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
	return '';
}

function getNodeId<S>(node: Base<S>): string {
	const nodeUnsafe: any = node;
	if (!nodeUnsafe.__nodeId) {
		try {
			let foo:any = v4();
			let id:string = foo.replace(/\-/g, '');
			nodeUnsafe.__nodeId = `n`+id;
		}
		catch(err) {
			console.error("Unable to get node id: ", err);
		}
	}
	return nodeUnsafe.__nodeId;
}

function getLabel<S>(node: Base<S>): string {
	if (node.symbol) {
		return `label="${node.name}\\n${node.symbol}"`;
	} else {
		return `label="${node.name}"`;
	}
}

function getTooltip<S>(node: Base<S>): string {
	return `tooltip="${node.constructor.name}"`;
}

export function serializeDotTree<S>(root: Base<S>, state?: S): any {
	const nodesToVisit: Base<S>[] = [];

	let resultingString = getHeader();
	let footer = getFooter();

	if (!root) {
		return resultingString + footer;
	}

	nodesToVisit.push(root);

	while (nodesToVisit.length) {
		const currentNode = nodesToVisit.pop();

		const nodeId = getNodeId(currentNode!);

		const label = getLabel(currentNode!);
		const shape = getShape(currentNode!);
		const toolTip = getTooltip(currentNode!);
		const color = getColor(currentNode!, state);

		resultingString += `\t${nodeId} `;
		resultingString += `[${label} ${shape} ${toolTip}`;
		resultingString += ` ${color}];\n`;

		if ((<any>currentNode).children) {
			resultingString = (<any>currentNode).children.reduce(
				(acc: string, child: Base<S>) => (`${acc}\t${nodeId}->${getNodeId(child)};\n`),
				resultingString);
			for (const child of [...(<any>currentNode).children].reverse()) {
				nodesToVisit.push(child);
			}
		}
	}

	resultingString += footer;

	return resultingString;
}
