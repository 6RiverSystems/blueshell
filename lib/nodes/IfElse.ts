/**
 * Created by jpollak on 5/29/16.
 */
import {BlueshellState, ResultCode, isResultCode, rc, BaseNode} from '../models';
import {Parent, Constant} from '.';

export interface Conditional<S, E> {
	(state: S, event: E): boolean;
}

/**
 * If-Else Conditional Composite Node.
 *
 * If `conditional(state: S, event: E)` returns true,
 * control is passed to the consequent node.
 *
 * If `conditional(state: S, event: E)` returns false,
 * control is passed to the alternative node, or
 * if alternative is a result code, that is returned, or
 * if one is not provided, 'FAILURE' is returned.
 *
 * 5/29/16
 * @author Joshua Chaitin-Pollak
 */
export class IfElse<S extends BlueshellState, E> extends Parent<S, E> {
	private alternative?: BaseNode<S, E>;
	private children: BaseNode<S, E>[];

	constructor(name: string,
	            private conditional: Conditional<S, E>,
	            private consequent: BaseNode<S, E>,
	            alternative?: BaseNode<S, E> | ResultCode) {
		super(name);
		this.children = [consequent];
		if (!!alternative) {
			if (isResultCode(alternative)) {
				this.alternative = new Constant(alternative);
			} else {
				this.alternative = alternative;
			}
			this.children.push(this.alternative);
		}
		this.initChildren(this.children);
	}

	/**
	 * Returns the children of this node, i.e. the `consequent` and the optional `alternative`.
	 * this is to support the DOT & Archy visualizers
	 * see Composite<S,E>.addEventCounterToChildren
	 */
	getChildren() {
		return this.children;
	}

	/**
	 * If `conditional` resolves to `true`, then the `consequent` node handles the event.
	 * Otherwise, the `alternative` node handles the event.
	 * If no `alternative` is provided, this node resolves to `FAILURE`
	 * @override
	 * @param state The state when the event occured.
	 * @param event The event to handle.
	 * @param i The child index.
	 */
	protected onEvent(state: S, event: E) {
		if (this.conditional(state, event)) {
			return this.consequent.handleEvent(state, event);
		} else if (this.alternative) {
			return this.alternative.handleEvent(state, event);
		} else {
			return rc.FAILURE;
		}
	}

	get symbol(): string {
		return '?';
	}
}
