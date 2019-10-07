import {BlueshellState} from '../nodes/BlueshellState';
import {Decorator} from '../nodes/Decorator';
import {DecoratorFn} from './decoratorFunction';
import {Base as Action} from '../nodes/Base';


class Before<S extends BlueshellState, E> extends Decorator<S, E> {
	constructor(
		name: string,
		action: Action<S, E>,
		private readonly before: DecoratorFn,
	) {
		super(name, action);
	}
	_beforeEvent(s: S, e: E) {
		this.before(s, e);

		return super._beforeEvent(s, e);
	}
}

export function before<S extends BlueshellState, E>(
	action: Action<S, E>,
	beforeFn: DecoratorFn,
): Action<S, E> {
	return new Before(`before-$action.name`, action, beforeFn);
}
