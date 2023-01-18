import { BlueshellState, rc, ResultCode, BaseNode } from '../../models';
import { Decorator } from '../Decorator';

/**
 * !Node
 * Node returns `FAILURE` when the child returns `SUCCESS`.
 * Node returns `SUCCESS` when the child returns `FAILURE`.
 * Node returns `RUNNING` when the child returns `RUNNING`.
 * 1/12/16
 * @author Joshua Chaitin-Pollak
 */
export class Not<S extends BlueshellState, E> extends Decorator<S, E> {
	/**
	 * Can only pass in one child.
	 * @constructor
	 * @param name
	 * @param child
	 */
	constructor(name: string, child: BaseNode<S, E>, latched = true) {
		super(name, child, latched);
	}

	/**
	 * @override
	 * @param state The state when the event occured.
	 * @param event The event to handle.
	 */
	protected decorateResult(res: ResultCode): ResultCode {
		switch (res) {
			case rc.SUCCESS:
				res = rc.FAILURE;
				break;
			case rc.FAILURE:
				res = rc.SUCCESS;
				break;
			default:
			// no-op
		}

		return res;
	}

	get symbol(): string {
		return '∼';
	}
}
