import {BlueshellState} from '../nodes/BlueshellState';
import {Base} from '../nodes/Base';
import {Composite} from '..';
import {v4} from 'uuid';
import {ResultCode} from './resultCodes';
import {IfElse} from '../nodes/IfElse';

function isComposite<S extends BlueshellState, E>(node: Base<S, E>): node is Composite<S, E> {
	return node instanceof Composite || node instanceof IfElse;
}

const ids: Map<Base<BlueshellState, unknown>, string> = new Map<Base<BlueshellState, unknown>, string>();
function getNodeId(node: Base<BlueshellState, unknown>) {
	if (!ids.has(node)) {
		ids.set(node, `n${v4().replace(/\-/g, '')}`);
	}
	return ids.get(node)!;
}

export abstract class NodeVisitor<S extends BlueshellState, E, T = void> {
	public visit(node: Base<S, E>): T {
		return this.visitStateless(new StatelessAnalysis(node, this));
	}

	protected abstract visitStateless(analysis: StatelessAnalysis<S, E, T>): T;
}

export abstract class NodeStateVisitor<S extends BlueshellState, E, T = void> {
	public visit(node: Base<S, E>, state: S, contextDepth: number): T {
		const eventCounter = node.getTreeEventCounter(state);
		const lastEventSeen = node.getLastEventSeen(state);
		const lastResult = node.getLastResult(state);

		if (lastEventSeen === eventCounter && lastResult) {
			return this.visitOnPath(new OnPathAnalysis(node, state, lastResult, contextDepth, this));
		} else {
			if (contextDepth < 0) {
				return this.visitOutOfContext(new NodeAnalysis(node));
			}
			if (contextDepth === 0) {
				if (isComposite(node) && node.children.length > 0) {
					return this.visitEdgeOfContext(new NodeAnalysis(node));
				} else {
					return this.visitInContext(new InContextAnalysis(node, state, contextDepth, this));
				}
			}
			return this.visitInContext(new InContextAnalysis(node, state, contextDepth - 1, this));
		}
	}

	protected abstract visitOnPath(analysis: OnPathAnalysis<S, E, T>): T;
	protected abstract visitInContext(analysis: InContextAnalysis<S, E, T>): T;
	protected abstract visitEdgeOfContext(analysis: NodeAnalysis<S, E>): T;
	protected abstract visitOutOfContext(analysis: NodeAnalysis<S, E>): T;
}

export class NodeAnalysis<S extends BlueshellState, E> {
	constructor(protected readonly node: Base<S, E>) {}
	public get name() {
		return this.node.name;
	}

	public get nodeType() {
		return this.node.constructor.name;
	}

	public get id() {
		return getNodeId(this.node);
	}

	public get symbol() {
		return this.node.symbol;
	}

	public isOfType(t: Function) {
		return this.node instanceof t;
	}
}

export class StatefulAnalysis<S extends BlueshellState, E> extends NodeAnalysis<S, E> {
	constructor(node: Base<S, E>, public readonly state: S) {
		super(node);
	}
}

export class StatelessAnalysis<S extends BlueshellState, E, T = void> extends NodeAnalysis<S, E> {
	constructor(
		node: Base<S, E>,
		private readonly visitor: NodeVisitor<S, E, T>
	) {
		super(node);
	}
	public* visitChildren() {
		if (isComposite(this.node)) {
			for (const child of this.node.children) {
				yield this.visitor.visit(child);
			}
		}
	}
}

export class OnPathAnalysis<S extends BlueshellState, E, T = void> extends StatefulAnalysis<S, E> {
	constructor(
		node: Base<S, E>,
		state: S,
		public readonly lastResult: ResultCode,
		private readonly contextDepth: number,
		private readonly visitor: NodeStateVisitor<S, E, T>
	) {
		super(node, state);
	}
	public* visitChildren() {
		if (isComposite(this.node)) {
			for (const child of this.node.children) {
				yield this.visitor.visit(child, this.state, this.contextDepth);
			}
		}
	}
}

export class InContextAnalysis<S extends BlueshellState, E, T = void> extends StatefulAnalysis<S, E> {
	constructor(
		node: Base<S, E>,
		state: S,
		private readonly contextDepth: number,
		private readonly visitor: NodeStateVisitor<S, E, T>
	) {
		super(node, state);
	}
	public* visitChildren() {
		if (isComposite(this.node)) {
			for (const child of this.node.children) {
				yield this.visitor.visit(child, this.state, this.contextDepth);
			}
		}
	}
}
