import {Base} from './nodes/Base';
import {Composite} from './nodes/Composite';
import {Decorator} from './nodes/Decorator';
import {Sequence} from './nodes/Sequence';
import {Selector} from './nodes/Selector';
import {LatchedSelector} from './nodes/LatchedSelector';
import {LatchedSequence} from './nodes/LatchedSequence';
import {IfElse} from './nodes/IfElse';
// import {resultCodes} from './utils/resultCodes';

import * as utils from './utils';
import * as decorators from './nodes/decorators';

const Action = Base;
const Condition = Base;
const resultCodes = utils.resultCodes;

export {
	// Base types to be extended
	Action,
	Composite,
	Condition,
	Decorator,

	// Decorators
	decorators,

	// Composites
	Sequence,
	Selector,
	LatchedSelector,
	LatchedSequence,
	IfElse,

	// Utilities
	utils,

	// Result Codes
	resultCodes,

};
