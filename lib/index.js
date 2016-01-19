'use strict';

var Base = require('./nodes/Base');
var Composite = require('./nodes/Composite');
var Decorator = require('./nodes/Decorator');
var Not = require('./nodes/Not');
var Selector = require('./nodes/Selector');
var Sequence = require('./nodes/Sequence');
var LatchedSelector = require('./nodes/LatchedSelector');
var LatchedSequence = require('./nodes/LatchedSequence');

module.exports = {
	// Base types to be extended
	Action: Base,
	Composite,
	Condition: Base,
	Decorator,

	// Decorators
	Not,

	// Composites
	Sequence,
	Selector,
	LatchedSelector,
	LatchedSequence
};
