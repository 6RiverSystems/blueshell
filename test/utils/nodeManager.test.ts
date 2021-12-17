import 'mocha';
import * as sinon from 'sinon';
import {assert} from 'chai';
import {APIFunctionNotFound, DuplicateNodeAdded, NodeManager} from '../../lib/utils/nodeManager';
import {BlueshellState} from '../../lib/models';
import {Base} from '../../lib/nodes/Base';
import {Sequence} from '../../lib/nodes';
import {Session, Runtime} from 'inspector';
import * as WebSocket from 'ws';
import {Utils} from '../../lib/utils/nodeManagerHelper';

describe('nodeManager', function() {
	let nodeManager: NodeManager<BlueshellState, null>;
	beforeEach(function() {
		// reset the singleton
		NodeManager['instance'] = null;
		nodeManager = NodeManager.getInstance();
	});

	describe('reset the singleton', function() {
		it('should find node', function() {
			const testNode = new Base<BlueshellState, null>('testNode');
			nodeManager.addNode(testNode);
			const node = nodeManager.getNode('testNode');
			assert.equal(node, testNode);
		});

		it('should not find node', function() {
			const node = nodeManager.getNode('testNode');
			assert.isUndefined(node);
		});
	});

	describe('add/get/remove node', function() {
		it('should handle a node at the root', function() {
			const rootNode = new Base<BlueshellState, null>('testNode');

			nodeManager.addNode(rootNode);
			assert.equal(nodeManager.getNode('testNode'), rootNode);

			nodeManager.removeNode(rootNode);
			assert.isUndefined(nodeManager.getNode('testNode'));
		});

		it('should handle a node with a deep path', function() {
			const childNode = new Base<BlueshellState, null>('childTestNode');
			new Sequence<BlueshellState, null>('rootTestNode', [childNode]);

			nodeManager.addNode(childNode);
			assert.equal(nodeManager.getNode('rootTestNode_childTestNode'), childNode);

			assert.isUndefined(nodeManager.getNode('rootTestNode'));

			nodeManager.removeNode(childNode);
			assert.isUndefined(nodeManager.getNode('rootTestNode_childTestNode'));
		});

		it('should throw if duplicate node added', function() {
			const rootNode = new Base<BlueshellState, null>('testNode');

			nodeManager.addNode(rootNode);
			assert.equal(nodeManager.getNode('testNode'), rootNode);

			try {
				nodeManager.addNode(rootNode);
				assert(false, 'addNode should throw when adding duplicate node');
			} catch (err) {
				assert.instanceOf(err, DuplicateNodeAdded);
			}

			nodeManager.removeNode(rootNode);
			assert.isUndefined(nodeManager.getNode('testNode'));
		});

		it('should implicitly add and remove all children nodes', function() {
			const childNode = new Base<BlueshellState, null>('childTestNode');
			const rootNode = new Sequence<BlueshellState, null>('rootTestNode', [childNode]);

			nodeManager.addNode(rootNode);
			assert.equal(nodeManager.getNode('rootTestNode'), rootNode);
			assert.equal(nodeManager.getNode('rootTestNode_childTestNode'), childNode);

			nodeManager.removeNode(rootNode);
			assert.isUndefined(nodeManager.getNode('rootTestNode'));
			assert.isUndefined(nodeManager.getNode('rootTestNode_childTestNode'));
		});
	});

	describe('websocket api', function() {
		let session: Session;
		let client: WebSocket;
		beforeEach(function(done) {
			session = nodeManager['session'];
			nodeManager.runServer();

			// stub all the session post calls so we don't actually set breakpoints
			sinon.stub(session, <any>'post')
			.withArgs(
				'Debugger.enable',
				sinon.match.func)
			.callsFake((callback: () => void
			) => {
				callback();
			});

			client = new WebSocket('ws://localhost:8990');
			client.onopen = () => {
				if (client.readyState === 1) {
					done();
				}
			};
		});

		afterEach(async function() {
			client.close();
			await nodeManager.shutdown();
		});

		async function serverResponse(serverAPIFunction: string, params: {}): Promise<any> {
			return await new Promise((resolve) => {
				client.onmessage = (event) => {
					const dataObj = JSON.parse(event.data as string);
					// only resolve the promise if we hear a reply from the request which was sent
					if (dataObj.request === serverAPIFunction) {
						client.removeAllListeners('onmessage');
						resolve(dataObj);
					}
				};

				client.send(JSON.stringify({
					request: serverAPIFunction,
					...params
				}));
			});
		}

		describe('getMethodsForNode', function() {
			it('should get all methods and properties for a node', async function() {
				const rootNode = new Base<BlueshellState, null>('testNode');
				nodeManager.addNode(rootNode);

				const response = await serverResponse('getMethodsForNode', {nodePath: 'testNode'});
				assert.equal(response.nodePath, 'testNode');
				assert.equal(response.nodeParent, '');
				assert.isTrue(response.success);

				assert.deepEqual(response.listOfMethods, Utils.getMethodInfoForObject(rootNode));
			});

			it('should not return success if node not found', async function() {
				const response = await serverResponse('getMethodsForNode', {nodePath: 'testNode'});
				assert.equal(response.nodePath, 'testNode');
				assert.isFalse(response.success);
			});
		});

		describe('placeBreakpoint', function() {
			// TODO
		});

		describe('removeBreakpoint', function() {
			// TODO
		});

		describe('unknown request', function() {
			it('should report error if api function does not exist', async function() {
				const response = await serverResponse('foobar', {});
				assert.equal(response.request, 'foobar');
				assert.isFalse(response.success);
				assert.equal(response.err, new APIFunctionNotFound('foobar').message);
			});
		});
	});
});
