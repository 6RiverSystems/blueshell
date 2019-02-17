import {BlueshellState} from '../nodes/BlueshellState';
import {Base} from '../nodes/Base';
import {Composite} from '..';
import {v4} from 'uuid';

function isComposite<S extends BlueshellState, E>(node: Base<S, E>): node is Composite<S, E> {
	return node instanceof Composite;
}

// Node types:
// onpath -- constructor takes lastResult; can visit children (uses factory + state + same context)
// incontext -- can visit children (uses factory + state + reduced context)
// eliding -- cannot visit children (edge of context)
// missing -- cannot visit children (context escaped somehow)

// visitor: visit method for each type of child

// node factory -- raw node to one of four types

export class ContextualNodeAnalysisFactory<S extends BlueshellState, E> {
	public manufacture(node: Base<S, E>, state: S, contextDepth: number) {
		const eventCounter = node.getTreeEventCounter(state);
		const lastEventSeen = node.getLastEventSeen(state);
		const lastResult = node.getLastResult(state);

		if (lastEventSeen === eventCounter && lastResult) {
			return new OnPathAnalysis(node, lastResult, state, contextDepth, this);
		} else {
			if (contextDepth < 0) {
				return new MissingAnalysis(node, state, contextDepth, this);
			}
			if (contextDepth === 0) {
				return new ElidingAnalysis(node, state, contextDepth, this);
			}
			return new InContextAnalysis(node, state, contextDepth - 1, this);
		}
	}
}

export class NodeAnalysis<S extends BlueshellState, E> {
	private static ids: Map<Base<BlueshellState, unknown>, string> = new Map<Base<BlueshellState, unknown>, string>();

	constructor(protected readonly node: Base<S, E>) {}
	public get children() {
		return isComposite(this.node) ? this.node.children.map((c) => new NodeAnalysis(c)) : [];
	}

	public get name() {
		return this.node.name;
	}

	public get nodeType() {
		return this.node.constructor.name;
	}

	public getLastResult(state: S) {
		const eventCounter = this.node.getTreeEventCounter(state);
		const lastEventSeen = this.node.getLastEventSeen(state);
		const lastResult = this.node.getLastResult(state);

		if (lastEventSeen === eventCounter && lastResult) {
			return lastResult;
		}
		return undefined;
	}

	public get id() {
		if (!NodeAnalysis.ids.has(this.node)) {
			NodeAnalysis.ids.set(this.node, `n${v4().replace(/\-/g, '')}`);
		}
		return NodeAnalysis.ids.get(this.node);
	}

	public get symbol() {
		return this.node.symbol;
	}
}
