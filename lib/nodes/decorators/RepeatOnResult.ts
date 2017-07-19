'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Action} from '../Action';
import {RepeatWhen} from './RepeatWhen';

export class RepeatOnResult<State> extends RepeatWhen<State> {

	constructor(repeatRes: ResultCodes, child: Action<State>) {
		super('ResultEquals-' + repeatRes, child, (res: ResultCodes) => res === repeatRes);
	}

}
