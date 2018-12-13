import {BlueshellState} from '../BlueshellState';
import {Base} from '../Base';
import {Decorator} from '../Decorator';
import { ResultCode } from '../../utils/resultCodes';

/**
 * Swaps one result from a child node for another.
 * This can be used to mask `FAILURE`
 *
 * For example, you can use this to have a Sequene continue operation if a child returns `FAILURE`.
 *
 * 1/21/16
 * @author Joshua Chaitin-Pollak
 */
export class ResultSwap<S extends BlueshellState, E> extends Decorator<S, E> {

	/**
	 * @constructor
	 * @param _inResult The result to swap out (mask).
	 * @param _outResult The result to return when the child returns `_inResult'.
	 * @param child The child Node of the decorator.
	 * @param desc Optional description of the Node.
	 */
	constructor(private _inResult: ResultCode,
							private _outResult: ResultCode,
							child: Base<S, E>,
							desc = `ResultSwap_${_inResult}-${_outResult}-${child.name}`) {
		super(desc, child);
	}

	/**
	 * Performs the swap from the child Node.
	 * @override
	 * @param state
	 * @param event
	 */
	async onEvent(state: S, event: E) {
		const res = await this.child.handleEvent(state, event);

		if (res === this._inResult) {
			return this._outResult;
		}

		return res;
	}

	get symbol(): string {
		return '↬';
	}
}
