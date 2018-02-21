'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Base} from '../Base';
import {RepeatWhenNTimes} from './RepeatWhenNTimes';

export class Retry<State> extends RepeatWhenNTimes<State> {

	constructor(child: Base<State>, numRetries: number) {
		super(`Retry-${numRetries}`, child, (res: ResultCodes) => res === ResultCodes.FAILURE, numRetries);
	}

}
