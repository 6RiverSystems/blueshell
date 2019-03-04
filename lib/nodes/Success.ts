import {BlueshellState} from './BlueshellState';
import {Base} from './Base';
import {resultCodes as rc} from '../utils/resultCodes';

export class Success<S extends BlueshellState, E> extends Base<S, E> {
	constructor(
		name = `Success`
	) {
		super(name);
	}

	onEvent() {
		return rc.SUCCESS;
	}
}
