/**
 * Created by josh on 1/12/16.
 */
import {BlueshellState} from '../BlueshellState';
import {Base} from '../Base';
import {Decorator} from '../Decorator';

export interface Conditional<S, E> {
	(state: S, event: E, res: string): boolean;
}

export class RepeatWhen<S extends BlueshellState, E> extends Decorator<S, E> {

	constructor(desc: string,
	            child: Base<S, E>,
	            private conditional: Conditional<S, E>) {
		super('RepeatWhen-' + desc, child);
	}

	onEvent(state: S, event: E): string {
		const res = this.child.handleEvent(state, event);

		if (this.conditional(state, event, res)) {
			return this.handleEvent(state, event);
		} else {
			return res;
		}
	}
}
