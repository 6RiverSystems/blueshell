/**
 * Created by josh on 1/12/16.
 */
import {BlueshellState} from '../BlueshellState';
import {Base} from '../Base';
import {RepeatWhen} from './RepeatWhen';

export class RepeatOnResult<S extends BlueshellState, E> extends RepeatWhen<S, E> {

	constructor(repeatRes: string, child: Base<S, E>) {
		super('ResultEquals-' + repeatRes, child,
			(state, event, res) => res === repeatRes);
	}

}
