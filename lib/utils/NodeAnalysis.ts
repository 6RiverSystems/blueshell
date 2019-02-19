import {BlueshellState} from '../nodes/BlueshellState';
import {Base} from '../nodes/Base';
import {Composite} from '..';
import {v4} from 'uuid';

function isComposite<S extends BlueshellState, E>(node: Base<S, E>): node is Composite<S, E> {
	return node instanceof Composite;
}

export abstract class NodeVisitor<S extends BlueshellState, E> {
	public visit(node: Base<S, E>, state: S, contextDepth: number) {
		const eventCounter = node.getTreeEventCounter(state);
		const lastEventSeen = node.getLastEventSeen(state);
		const lastResult = node.getLastResult(state);

		if (lastEventSeen === eventCounter && lastResult) {
			this.visitOnPath(new OnPathAnalysis(node, state, lastResult, contextDepth, this));
		} else {
			if (contextDepth < 0) {
				this.visitOutOfContext(new NodeAnalysis(node, state));
			}
			if (contextDepth === 0) {
				if (isComposite(node) && node.children.length > 0) {
					this.visitEdgeOfContext(new NodeAnalysis(node, state));
				} else {
					this.visitInContext(new InContextAnalysis(node, state, contextDepth, this));
				}
			}
			this.visitInContext(new InContextAnalysis(node, state, contextDepth - 1, this));
		}
	}

	protected abstract visitOnPath(analysis: OnPathAnalysis<S, E>): void;
	protected abstract visitInContext(analysis: InContextAnalysis<S, E>): void;
	protected abstract visitEdgeOfContext(analysis: NodeAnalysis<S, E>): void;
	protected abstract visitOutOfContext(analysis: NodeAnalysis<S, E>): void;
}

const ids: Map<Base<BlueshellState, unknown>, string> = new Map<Base<BlueshellState, unknown>, string>();
function getNodeId(node: Base<BlueshellState, unknown>) {
	if (!ids.has(node)) {
		ids.set(node, `n${v4().replace(/\-/g, '')}`);
	}
	return ids.get(node);
}

export class NodeAnalysis<S extends BlueshellState, E> {
	constructor(protected readonly node: Base<S, E>, public readonly state: S) {}
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
}

export class OnPathAnalysis<S extends BlueshellState, E> extends NodeAnalysis<S, E> {
	constructor(
		node: Base<S, E>,
		state: S,
		public readonly lastResult: string,
		private readonly contextDepth: number,
		private readonly visitor: NodeVisitor<S, E>
	) {
		super(node, state);
	}
	public visitChildren() {
		if (isComposite(this.node)) {
			for (const child of this.node.children) {
				this.visitor.visit(child, this.state, this.contextDepth);
			}
		}
	}
}

export class InContextAnalysis<S extends BlueshellState, E> extends NodeAnalysis<S, E> {
	constructor(
		node: Base<S, E>,
		state: S,
		private readonly contextDepth: number,
		private readonly visitor: NodeVisitor<S, E>
	) {
		super(node, state);
	}
	public visitChildren() {
		if (isComposite(this.node)) {
			for (const child of this.node.children) {
				this.visitor.visit(child, this.state, this.contextDepth);
			}
		}
	}
}
