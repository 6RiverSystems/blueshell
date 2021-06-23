/**
 * Created by jpollak on 5/29/16.
 */
import {BlueshellState, ResultCode, rc, BaseNode} from '../models';
import {IfElse, Conditional} from '.';

const LATCHED_RUNNING_CONSEQUENT = 1;
const LATCHED_RUNNING_ALTERNATIVE = 2;

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
export class IfElseLatched<S extends BlueshellState, E> extends IfElse<S, E> {
	constructor(
		name: string,
		private conditionalToLatch: Conditional<S, E>,
		consequent: BaseNode<S, E>,
		alternative?: BaseNode<S, E> | ResultCode
	) {
		super(
			name,
			(state: S, event: E) => {
				const storage = this.getNodeStorage(state);
				let res: boolean;
				if (!storage.running) {
					// we're not latched, so run the conditional and save the result
					res = this.conditionalToLatch(state, event);
					storage.running = res ? LATCHED_RUNNING_CONSEQUENT : LATCHED_RUNNING_ALTERNATIVE;
				} else {
					// we're latched, so return the saved result of the conditional
					res = storage.running === LATCHED_RUNNING_CONSEQUENT;
				}
				return res;
			},
			consequent,
			alternative,
		);
	}

	/**
	 * cosmetic only so a behavior tree viewer can render this as a latched node
	 */
	get latched() {
		return true;
	}

	protected _afterEvent(res: ResultCode, state: S, event: E): ResultCode {
		res = super._afterEvent(res, state, event);

		const storage = this.getNodeStorage(state);
		if (res !== rc.RUNNING) {
			// clear latched status if the node is no longer running after processing the event
			storage.running = undefined;
		}

		return res;
	}
}
