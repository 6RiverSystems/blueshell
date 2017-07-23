'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Base} from '../Base';
import {RepeatWhen} from './RepeatWhen';

export class RepeatOnResult<State> extends RepeatWhen<State> {

	constructor(repeatRes: ResultCodes, child: Base<State>) {
		super('ResultEquals-' + repeatRes, child, (res: ResultCodes) => res === repeatRes);
	}

}
