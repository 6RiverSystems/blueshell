import {assert} from 'chai';

import {RobotState, waitAi} from './test/RobotActions';
import {isParentNode} from '../../lib';
import {setEventCounter, clearChildEventSeen} from '../../lib/nodes/Parent';


describe('Composite', function() {
	context('#isParentNode', function() {
		it('should detect a parent node', function() {
			assert.isTrue(isParentNode(waitAi), 'Latched Selector not reporting it is a parent');
		});
		it('should not detect a parent node', function() {
			assert.isFalse(isParentNode(waitAi.getChildren()[0]), 'Base action reporting it is a parent');
		});
	});
	context('#setEventCounter', function() {
		it('should set event counter for parent and all previously visited children', function() {
			const state = new RobotState(false);
			const pStorage = (<any>waitAi)._privateStorage(state);
			pStorage.eventCounter = 2;
			waitAi.getNodeStorage(state).lastEventSeen = 1;
			waitAi.getChildren()[0].getNodeStorage(state).lastEventSeen = 1;
			waitAi.getChildren()[1].getNodeStorage(state).lastEventSeen = 0;
			setEventCounter(pStorage, state, waitAi);
			assert.strictEqual(waitAi.getNodeStorage(state).lastEventSeen, 2, 'waitAi lastEventSeen not 2');
			assert.strictEqual(
				waitAi.getChildren()[0].getNodeStorage(state).lastEventSeen,
				2,
				'waitAi child 0 lastEventSeen not 2'
			);
			assert.strictEqual(
				waitAi.getChildren()[1].getNodeStorage(state).lastEventSeen,
				2,
				'waitAi child 1 lastEventSeen not 2'
			);
			assert.isUndefined(
				waitAi.getChildren()[2].getNodeStorage(state).lastEventSeen,
				'waitAi child 2 lastEventSeen not undefined'
			);
		});
	});
	context('#modifyLastEventSeenRecursive', function() {
		it('should clear last event seen from the node and all child nodes', function() {
			const state = new RobotState(false);
			const pStorage = (<any>waitAi)._privateStorage(state);
			pStorage.eventCounter = 2;
			waitAi.getChildren()[0].getNodeStorage(state).lastEventSeen = 1;
			waitAi.getChildren()[1].getNodeStorage(state).lastEventSeen = 0;
			clearChildEventSeen(waitAi, state);
			assert.isUndefined(waitAi.getNodeStorage(state).lastEventSeen, 'waitAi lastEventSeen not undefined');
			assert.isUndefined(
				waitAi.getChildren()[0].getNodeStorage(state).lastEventSeen,
				'waitAi child 0 lastEventSeen not undefined'
			);
			assert.isUndefined(
				waitAi.getChildren()[1].getNodeStorage(state).lastEventSeen,
				'waitAi child 1 lastEventSeen not undefined'
			);
			assert.isUndefined(
				waitAi.getChildren()[2].getNodeStorage(state).lastEventSeen,
				'waitAi child 2 lastEventSeen not undefined'
			);
		});
	});
});
