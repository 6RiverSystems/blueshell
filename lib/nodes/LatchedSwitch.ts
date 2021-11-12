import {BlueshellState, ResultCode, isResultCode, rc, BaseNode, Conditional} from '../models';
import {Parent} from './Parent';
import {Constant} from './Constant';
import {SwitchEntry} from './Switch';

interface AdaptedSwitchEntry<S extends BlueshellState, E> {
	conditional: Conditional<S, E>,
	child: BaseNode<S, E>,
}

/**
 * Executes the child associated with the first matching conditional.
 * Returns defaultResult if no conditionals match.
 *
 * 11/9/21
 * @author Timothy Deignan
 */
export class LatchedSwitch<S extends BlueshellState, E> extends Parent<S, E> {
	private children: BaseNode<S, E>[];
	private entries: AdaptedSwitchEntry<S, E>[];

	constructor(
		name: string,
		entries: SwitchEntry<S, E>[],
		private readonly defaultResult: ResultCode = rc.SUCCESS,
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
		const storage = this.getNodeStorage(state);

		if (storage.running !== undefined) {
			const entry = this.entries[storage.running];
			return entry.child.handleEvent(state, event);
		}

		const entry = this.entries.find((e) => e.conditional(state, event));

		if (entry) {
			const storage = this.getNodeStorage(state);
			storage.running = this.entries.indexOf(entry);
			return entry.child.handleEvent(state, event);
		}

		return this.defaultResult;
	}

	protected _afterEvent(res: ResultCode, state: S, event: E): ResultCode {
		res = super._afterEvent(res, state, event);

		if (res !== rc.RUNNING) {
			const storage = this.getNodeStorage(state);
			storage.running = undefined;
		}

		return res;
	}

	getChildren() {
		return this.children;
	}

	get latched() {
		return true;
	}

	get symbol(): string {
		return '?';
	}
}
