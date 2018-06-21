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

const SelectorSymbol = '⌥';
const SequenceSymbol = '→';
const LatchedSymbol = '▣';
const LatchedSelectorSymbol = `${LatchedSymbol}${SelectorSymbol}`;
const LatchedSequenceSymbol = `${LatchedSymbol}${SequenceSymbol}`;
const IfElseSymbol = '?';
const NotSymbol= '∼';
const RepeatWhenSymbol = '↺';
const RepeatOnResultSymbol = `⊜${RepeatWhenSymbol}`;
const ResultSwapSymbol = '↬';

const nodeColorLegend = `
	RUNNING [${DefaultShape} ${NodeStyle} ${RunningColor}];
	SUCCESS [${DefaultShape} ${NodeStyle} ${SuccessColor}];
	FAILURE [${DefaultShape} ${NodeStyle} ${FailureColor}];
	ERROR [${DefaultShape} ${NodeStyle} ${ErrorColor}];
	NORESULT [${DefaultShape} ${NodeStyle} ${DefaultColor}];`;

const nodeShapeLegend = `
	Decorator [${DecoratorShape} ${NodeStyle} ${DefaultColor}];
	Composite [${CompositeShape} ${NodeStyle} ${DefaultColor}];
	Action [${DefaultShape} ${NodeStyle} ${DefaultColor}];`;

const nodeSymbolLegend = `
	Selector [${CompositeShape} ${NodeStyle} ${DefaultColor} label=<Selector<BR/><B>${SelectorSymbol}</B>>];
	Sequence [${CompositeShape} ${NodeStyle} ${DefaultColor} label=<Sequence<BR/><B>${SequenceSymbol}</B>>];
	LatchedSelector [${CompositeShape} ${NodeStyle} ${DefaultColor} \
label=<LatchedSelector<BR/><B>${LatchedSelectorSymbol}</B>>];
	LatchedSequence [${CompositeShape} ${NodeStyle} ${DefaultColor} \
label=<LatchedSequence<BR/><B>${LatchedSequenceSymbol}</B>>];
	IfElse [${CompositeShape} ${NodeStyle} ${DefaultColor} label=<IfElse<BR/><B>${IfElseSymbol}</B>>];
	Not [${DecoratorShape} ${NodeStyle} ${DefaultColor} label=<Not<BR/><B>${NotSymbol}</B>>];
	RepeatWhen [${DecoratorShape} ${NodeStyle} ${DefaultColor} label=<RepeatWhen<BR/><B>${RepeatWhenSymbol}</B>>];
	RepeatOnResult [${DecoratorShape} ${NodeStyle} ${DefaultColor} \
label=<RepeatOnResult<BR/><B>${RepeatOnResultSymbol}</B>>];
	ResultSwapSymbol [${DecoratorShape} ${NodeStyle} ${DefaultColor} \
label=<ResultSwapSymbol<BR/><B>${ResultSwapSymbol}</B>>];`;

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

export function serializeSymbolLegend(): string {
	return `digraph SymbolLegend {
${nodeSymbolLegend}
}`;
}

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
	const displayText = node.name;
	let nodeSymbol: string;
	if (node instanceof LatchedSelector) {
		nodeSymbol = LatchedSelectorSymbol;
	} else if (node instanceof Selector) {
		nodeSymbol = SelectorSymbol;
	} else if (node instanceof LatchedSequence) {
		nodeSymbol = LatchedSequenceSymbol;
	} else if (node instanceof Sequence) {
		nodeSymbol = SequenceSymbol;
	} else if (node instanceof IfElse) {
		nodeSymbol = IfElseSymbol;
	} else if (node instanceof Not) {
		nodeSymbol = NotSymbol;
	} else if (node instanceof RepeatOnResult) {
		nodeSymbol = RepeatOnResultSymbol;
	} else if (node instanceof RepeatWhen) {
		nodeSymbol = RepeatWhenSymbol;
	} else if (node instanceof ResultSwap) {
		nodeSymbol = ResultSwapSymbol;
	} else {
		return `label=${displayText}`;
	}
	return `label=<${displayText}<BR/><B>${nodeSymbol}</B>>`;
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
