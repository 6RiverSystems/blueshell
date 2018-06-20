import {Base} from '../nodes/Base';
import {BlueshellState} from '../nodes/BlueshellState';
import {Selector} from '../nodes/Selector';
import {LatchedSelector} from '../nodes/LatchedSelector';
import {LatchedSequence} from '../nodes/LatchedSequence';
import {Sequence} from '../nodes/Sequence';
import {IfElse} from '../nodes/IfElse';
import {Not, RepeatOnResult, RepeatWhen, ResultSwap} from '../nodes/decorators';
import {resultCodes as rc} from '../../lib/utils/resultCodes';

const NodeStyle = 'style=filled';

const LatchedSelectorShape = 'shape= height=1';
const SelectorShape = 'shape=diamond height=1';
const LatchedSequenceShape = 'shape=doubleoctagon';
const SequenceShape = 'shape=octagon';
const IfElseShape = 'shape=invtriangle';
const NotShape = 'shape=circle';
const RepeatOnResultShape = 'shape=house';
const RepeatWhenShape = 'shape=invhouse';
const ResultSwapShape = 'shape=egg';
const DefaultShape = 'shape=rectangle';

const SuccessColor = 'colorscheme=set14 fillcolor=3';
const FailureColor = 'colorscheme=set14 fillcolor=4';
const RunningColor = 'colorscheme=set14 fillcolor=2';
const ErrorColor = 'colorscheme=set14 fillcolor=1';
const DefaultColor = 'colorscheme=X11 fillcolor=gray90';

const nodeColorLegend = `
	RUNNING [shape=rectangle ${NodeStyle} ${RunningColor}];
	SUCCESS [shape=rectangle ${NodeStyle} ${SuccessColor}];
	FAILURE [shape=rectangle ${NodeStyle} ${FailureColor}];
	ERROR [shape=rectangle ${NodeStyle} ${ErrorColor}];
	NORESULT [shape=rectangle ${NodeStyle} ${DefaultColor}];
`;

const nodeShapeLegend = `
	Selector [${SelectorShape} ${NodeStyle} ${DefaultColor}];
	LatchedSelector = [${LatchedSelectorShape} ${NodeStyle} ${DefaultColor}];
	Sequence = [${SequenceShape} ${NodeStyle} ${DefaultColor}];
	LatchedSequence = [${LatchedSequenceShape} ${NodeStyle} ${DefaultColor}];
	IfElse = [${IfElseShape} ${NodeStyle} ${DefaultColor}];
	Not = [${NotShape} ${NodeStyle} ${DefaultColor}];
	RepeatOnResult = [${RepeatOnResultShape} ${NodeStyle} ${DefaultColor}];
	RepeatWhen = [${RepeatWhenShape} ${NodeStyle} ${DefaultColor}];
	ResultSwap = [${ResultSwapShape} ${NodeStyle} ${DefaultColor}];
	Action = [${DefaultShape} ${NodeStyle} ${DefaultColor}];
`;

export function serializeColorLegend(): string {
	return `digraph ColorLegend {
${nodeColorLegend}
}`;
}

export function serializeShapeLegend(): string {
	return `digraph ShapeLegend {
${nodeShapeLegend}
}`;
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
		{
			let shape: string;

			if (currentNode instanceof LatchedSelector) {
				shape = LatchedSelectorShape;
			} else if (currentNode instanceof Selector) {
				shape = SelectorShape;
			} else if (currentNode instanceof LatchedSequence) {
				shape = LatchedSequenceShape;
			} else if (currentNode instanceof Sequence) {
				shape = SequenceShape;
			} else if (currentNode instanceof IfElse) {
				shape = IfElseShape;
			} else if (currentNode instanceof Not) {
				shape = NotShape;
			} else if (currentNode instanceof RepeatOnResult) {
				shape = RepeatOnResultShape;
			} else if (currentNode instanceof RepeatWhen) {
				shape = RepeatWhenShape;
			} else if (currentNode instanceof ResultSwap) {
				shape = ResultSwapShape;
			} else {
				shape = DefaultShape;
			}

			let color: string = DefaultColor;
			if (state) {
				const eventCounter = currentNode!.getTreeEventCounter(state);
				const lastEventSeen = currentNode!.getLastEventSeen(state);
				const lastResult = currentNode!.getLastResult(state);

				if (lastEventSeen === eventCounter && lastResult) {
					switch (lastResult) {
					case rc.ERROR:
						color = ErrorColor;
						break;
					case rc.SUCCESS:
						color = SuccessColor;
						break;
					case rc.RUNNING:
						color = RunningColor;
						break;
					case rc.FAILURE:
						color = FailureColor;
						break;
					}
				}
			}

			resultingString += `\t${currentNode!.name} [${shape} ${color} ${NodeStyle}];\n`;
		}

		if ((<any>currentNode).children) {
			for (const child of (<any>currentNode).children) {
				resultingString += `\t${currentNode!.name} -> ${child.name}\n`;
			}
			for (const child of [...(<any>currentNode).children].reverse()) {
				nodesToVisit.push(child);
			}
		}
	}

	resultingString += '}';

	return resultingString;
}
