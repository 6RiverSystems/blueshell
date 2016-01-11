'use strict';

var Selector = require('./nodes/Selector');
var Sequence = require('./nodes/Sequence');
var Base = require('./nodes/Base');
var LogicalComponent = require('./LogicalComponent');

module.exports = {
	Selector,
	Priority: Selector, // Synonym
	Sequence,
	Action: Base,
	Condition: Base,
	LogicalComponent
};
