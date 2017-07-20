'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Action} from '../actions/Action';
import {RepeatWhen} from './RepeatWhen';

export class RepeatOnResult<State, Event> extends RepeatWhen<State, Event> {

	constructor(repeatRes: ResultCodes, child: Action<State, Event>) {
		super('ResultEquals-' + repeatRes, child, (res: ResultCodes) => res === repeatRes);
	}

}
