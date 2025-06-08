import {BlueshellState} from '../nodes/BlueshellState';
import {Decorator} from '../nodes/Decorator';
import {DecoratorFn} from './decoratorFunction';
import {Base as Action} from '../nodes/Base';
import {ResultCode} from '../utils/resultCodes';


class After<S extends BlueshellState, E> extends Decorator<S, E> {
	constructor(
		name: string,
		action: Action<S, E>,
		private readonly after: DecoratorFn,
	) {
		super(name, action);
	}
	_afterEvent(res: ResultCode, s: S, e: E) {
		this.after(s, e);

		return super._afterEvent(res, s, e);
	}
}

export function after<S extends BlueshellState, E>(
	action: Action<S, E>,
	afterFn: DecoratorFn,
): Action<S, E> {
	return new After(`before-$action.name`, action, afterFn);
}
