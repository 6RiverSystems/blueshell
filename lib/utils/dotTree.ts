import {Base} from '../nodes/Base';
import {BlueshellState} from '../nodes/BlueshellState';
import {resultCodes as rc} from './resultCodes';
import {Decorator} from '../nodes/Decorator';
import {Composite} from '../nodes/Composite';

import {v4} from 'uuid';

const DefaultStyle = 'style="filled,bold"';

const DecoratorShape = 'shape=ellipse';
const CompositeShape = 'shape=diamond height=1';
const DefaultShape = 'shape=box';

const SuccessColor = 'fillcolor="#4daf4a"';
const FailureColor = 'fillcolor="#984ea3"';
const RunningColor = 'fillcolor="#377eb8"';
const ErrorColor = 'fillcolor="#e41a1c"';
const DefaultColor = 'fillcolor="#e5e5e5"';

const DefaultEdgeColor ='color="#000000"';

import {
	NodeStateVisitor,
	OnPathAnalysis,
	InContextAnalysis,
	NodeAnalysis,
	NodeVisitor,
	StatelessAnalysis,
} from './NodeVisitor';

function getHeader() {
	return [
		'digraph G {',
		`\tnode [${DefaultShape} ${DefaultColor} ${DefaultStyle}]`,
		`\tedge [${DefaultEdgeColor}]`,
	];
}

function getFooter() {
	return [
		'}',
	];
}

export class DotStatelessVisitor<S extends BlueshellState, E> extends NodeVisitor<S, E, string> {
	private _lines: string[];
	constructor() {
		super();
		this._lines = getHeader();
	}
	public get lines() {
		return this._lines.concat(getFooter());
	}
	protected visitStateless(analysis: StatelessAnalysis<S, E, string>) {
		const nodeId = analysis.id;

		this._lines.push(
			`\t${nodeId} ` +
			`[${getLabel(analysis)} ${getShape(analysis)} ${getTooltip(analysis)}];`
		);

		for ( const childId of analysis.visitChildren() ) {
			this._lines.push(`\t${nodeId}->${childId};`);
		}

		return nodeId;
	}
}

export class DotStateVisitor<S extends BlueshellState, E> extends NodeStateVisitor<S, E, string> {
	private _lines: string[];
	constructor() {
		super();
		this._lines = getHeader();
	}
	public get lines() {
		return this._lines.concat(getFooter());
	}
	protected visitOnPath(analysis: OnPathAnalysis<S, E, string>): string {
		const nodeId = analysis.id;

		this._lines.push(
			`\t${nodeId} ` +
			`[${getLabel(analysis)} ${getShape(analysis)} ${getTooltip(analysis)}` +
			` ${getColor(analysis)}];`
		);

		for ( const childId of analysis.visitChildren() ) {
			this._lines.push(`\t${nodeId}->${childId};`);
		}

		return nodeId;
	}
	protected visitInContext(analysis: InContextAnalysis<S, E, string>): string {
		const nodeId = analysis.id;

		this._lines.push(
			`\t${nodeId} ` +
			`[${getLabel(analysis)} ${getShape(analysis)} ${getTooltip(analysis)}]`
		);

		for ( const childId of analysis.visitChildren() ) {
			this._lines.push(`\t${nodeId}->${childId};`);
		}

		return nodeId;
	}
	protected visitEdgeOfContext(analysis: NodeAnalysis<S, E>): string {
		const nodeId = analysis.id;

		this._lines.push(
			`\t${nodeId} ` +
			`[label="..." ${getShape(analysis)} ${getTooltip(analysis)}]`
		);

		return nodeId;
	}
	protected visitOutOfContext(analysis: NodeAnalysis<S, E>): string {
		const nodeId = analysis.id;

		this._lines.push(
			`\t${nodeId} ` +
			`[label="?"]`
		);

		return nodeId;
	}
}

function getShape(analysis: NodeAnalysis<BlueshellState, unknown>): string {
	if (analysis.isOfType(Decorator)) {
		return DecoratorShape;
	} else if (analysis.isOfType(Composite)) {
		return CompositeShape;
	} else {
		return '';
	}
}

function getColor(analysis: OnPathAnalysis<BlueshellState, unknown, any>) {
	switch (analysis.lastResult) {
	case rc.ERROR:
		return ErrorColor;
	case rc.SUCCESS:
		return SuccessColor;
	case rc.RUNNING:
		return RunningColor;
	case rc.FAILURE:
		return FailureColor;
	}
	return '';
}

function getLabel(analysis: NodeAnalysis<BlueshellState, unknown>): string {
	if (analysis.symbol) {
		return `label="${analysis.name}\\n${analysis.symbol}"`;
	} else {
		return `label="${analysis.name}"`;
	}
}

function getTooltip(analysis: NodeAnalysis<BlueshellState, unknown>): string {
	return `tooltip="${analysis.nodeType}"`;
}

export function serializeDotTree<S extends BlueshellState, E>(
	root: Base<S, E>, state?: S, contextDepth = Number.MAX_SAFE_INTEGER
) {
	if (!root) {
		return '';
	}

	if (state) {
		const v = new DotStateVisitor<S, E>();
		v.visit(root, state, contextDepth);
		return v.lines.join('\n');
	} else {
		const v = new DotStatelessVisitor<S, E>();
		v.visit(root);
		return v.lines.join('\n');
	}
}
