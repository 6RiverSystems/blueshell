import {BlueshellState, ResultCode, isResultCode, rc, BaseNode, Conditional} from '../models';
import {Parent} from './Parent';
import {Constant} from './Constant';

export interface SwitchEntry<S extends BlueshellState, E> {
	conditional?: Conditional<S, E>,
	child: BaseNode<S, E> | ResultCode,
}

interface AdaptedSwitchEntry<S extends BlueshellState, E> {
	conditional: Conditional<S, E>,
	child: BaseNode<S, E>,
}

/**
 * Executes the child action associated with the first matching conditional.
 * Returns defaultResult if no conditionals match.
 *
 * 11/9/21
 * @author Timothy Deignan
 */
export class Switch<S extends BlueshellState, E> extends Parent<S, E> {
	private children: BaseNode<S, E>[];
	protected entries: AdaptedSwitchEntry<S, E>[];

	constructor(
		name: string,
		entries: SwitchEntry<S, E>[],
		protected readonly defaultResult: ResultCode = rc.SUCCESS,
	) {
		super(name);
		this.entries = entries.map((e) => {
			return {
				conditional: e.conditional || (() => true),
				child: isResultCode(e.child) ? new Constant(e.child) : e.child,
			};
		});
		this.children = this.entries.map((e) => e.child);
		this.initChildren(this.children);
	}

	protected onEvent(state: S, event: E) {
		const entry = this.entries.find((e) => e.conditional(state, event));

		if (entry) {
			return entry.child.handleEvent(state, event);
		} else {
			return this.defaultResult;
		}
	}

	getChildren() {
		return this.children;
	}

	get symbol(): string {
		return '?';
	}
}
