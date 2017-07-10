/**
 * Created by josh on 1/12/16.
 */
'use strict';

import {RepeatWhen} from './RepeatWhen';
import {Base} from '../Base';
import {BehaviorCode} from '../../utils/ResultCodes';

export class RepeatOnResult extends RepeatWhen {

	constructor(repeatRes: BehaviorCode, child: Base) {
		super('ResultEquals-' + repeatRes, child, (res: BehaviorCode) => res === repeatRes);
	}

}
