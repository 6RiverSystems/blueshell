import 'mocha';
import {EventEmitter} from 'events';
import {Session} from 'inspector';

import {assert} from 'chai';
import * as sinon from 'sinon';
import WebSocket from 'ws';

import {BlueshellState} from '../../lib/models';
import {Action, Sequence} from '../../lib/nodes';
import {APIFunctionNotFound, DuplicateNodeAdded, NodeManager, INodeManager} from '../../lib/utils/nodeManager';
import {RuntimeWrappers, Utils} from '../../lib/utils/nodeManagerHelper';


class WebSocketServerMock extends EventEmitter {
	close() {}
}

class WebSocketClientMock extends EventEmitter {
	public lastResponse: any;
	send(data: string) {
		this.lastResponse = JSON.parse(data);
		this.emit('messageHandled', this.lastResponse);
	}
}

class SequenceWithSetter extends Sequence<BlueshellState, null> {
	set setterOnlyProp(foo: string) {}
	get foo() {
		return 'foo';
	}
	set foo(f: string) {}
}

describe('nodeManager', function() {
	let nodeManager: INodeManager<BlueshellState, null>;

	beforeEach(function() {
		// reset the singleton
		NodeManager.reset();
		nodeManager = NodeManager.getInstance();
	});

	afterEach(function() {
		sinon.restore();
	});

	describe('reset the singleton', function() {
		it('should find node', function() {
			const testNode = new Action<BlueshellState, null>('testNode');
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
			const rootNode = new Action<BlueshellState, null>('testNode');

			nodeManager.addNode(rootNode);
			assert.equal(nodeManager.getNode('testNode'), rootNode);

			nodeManager.removeNode(rootNode);
			assert.isUndefined(nodeManager.getNode('testNode'));
		});

		it('should handle a node with a deep path', function() {
			const childNode = new Action<BlueshellState, null>('childTestNode');
			new Sequence<BlueshellState, null>('rootTestNode', [childNode]);

			nodeManager.addNode(childNode);
			assert.equal(nodeManager.getNode('rootTestNode_childTestNode'), childNode);

			assert.isUndefined(nodeManager.getNode('rootTestNode'));

			nodeManager.removeNode(childNode);
			assert.isUndefined(nodeManager.getNode('rootTestNode_childTestNode'));
		});

		it('should throw if duplicate node added', function() {
			const rootNode = new Action<BlueshellState, null>('testNode');

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
			const childNode = new Action<BlueshellState, null>('childTestNode');
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
		let serverStub: sinon.SinonStub;
		let serverMock: WebSocketServerMock;
		let clientMock: WebSocketClientMock;
		let serverCloseStub: sinon.SinonStub;
		let clientSendSpy: sinon.SinonSpy;
		let removeBreakpointHelperStub: sinon.SinonStub;
		let setBreakpointHelperStub: sinon.SinonStub;

		beforeEach(function() {
			serverMock = new WebSocketServerMock();
			clientMock = new WebSocketClientMock();
			serverStub = sinon.stub(WebSocket, 'Server').returns(serverMock);
			serverCloseStub = sinon.stub(serverMock, 'close');
			clientSendSpy = sinon.spy(clientMock, 'send');
			removeBreakpointHelperStub = sinon.stub(RuntimeWrappers, 'removeBreakpointFromFunction').callThrough();
			setBreakpointHelperStub = sinon.stub(RuntimeWrappers, 'setBreakpointOnFunctionCall').callThrough();
			session = (<NodeManager<BlueshellState, null>>nodeManager)['session'];

			nodeManager.runServer();
			sinon.assert.calledWith(serverStub, {
				host: 'localhost',
				port: 8990,
			});
			serverMock.emit('connection', clientMock);
		});

		afterEach(function() {
			session.disconnect();
			sinon.reset();
		});

		describe('getMethodsForNode', function() {
			it('should get all methods and properties for a node', async function() {
				const rootNode = new Action<BlueshellState, null>('testNode');
				nodeManager.addNode(rootNode);

				clientMock.emit('message', JSON.stringify({
					request: 'getMethodsForNode',
					nodePath: 'testNode',
				}));
				sinon.assert.calledWith(clientSendSpy, JSON.stringify({
					request: 'getMethodsForNode',
					success: true,
					nodePath: 'testNode',
					listOfMethods: Utils.getMethodInfoForObject(rootNode),
					nodeName: 'testNode',
					nodeParent: '',
				}));
			});

			it('should get all methods and properties for a child node', async function() {
				const childNode = new Action<BlueshellState, null>('childTestNode');
				const rootNode = new Sequence<BlueshellState, null>('rootTestNode', [childNode]);
				nodeManager.addNode(rootNode);

				clientMock.emit('message', JSON.stringify({
					request: 'getMethodsForNode',
					nodePath: 'rootTestNode_childTestNode',
				}));
				sinon.assert.calledWith(clientSendSpy, JSON.stringify({
					request: 'getMethodsForNode',
					success: true,
					nodePath: 'rootTestNode_childTestNode',
					listOfMethods: Utils.getMethodInfoForObject(childNode),
					nodeName: 'childTestNode',
					nodeParent: 'rootTestNode',
				}));
			});

			it('should not return success if node not found', async function() {
				clientMock.emit('message', JSON.stringify({
					request: 'getMethodsForNode',
					nodePath: 'testNode',
				}));

				sinon.assert.calledWith(clientSendSpy, JSON.stringify({
					request: 'getMethodsForNode',
					success: false,
					nodePath: 'testNode',
				}));
			});
		});

		describe('breakpoints', function() {
			let childNode: Action<BlueshellState, null>;
			let rootNode: SequenceWithSetter;
			const rootNodeName = 'rootTestNode';
			const childNodeName = 'childTestNode';
			const childNodePath = `${rootNodeName}_${childNodeName}`;
			const condition = 'this.name === \'foo\'';

			beforeEach(function() {
				childNode = new Action<BlueshellState, null>(childNodeName);
				rootNode = new SequenceWithSetter(rootNodeName, [childNode]);
				nodeManager.addNode(rootNode);
			});

			describe('placeBreakpoint', function() {
				it('should place a breakpoint with no additional condition', async function() {
					clientMock.emit('message', JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: childNodePath,
						methodName: 'handleEvent',
						condition: '',
					}));
					// this is required to get over the promises that happen in the async callback when we emit message above
					await EventEmitter.once(clientMock, 'messageHandled');
					sinon.assert.notCalled(removeBreakpointHelperStub);
					const bps = new Map();
					bps.set(childNodePath, {
						nodePath: childNodePath,
						condition: '',
						nodeName: childNodeName,
						nodeParent: rootNodeName,
					});
					sinon.assert.calledWith(setBreakpointHelperStub,
						sinon.match.object,
						sinon.match.string,
						`(this.path === '${childNodePath}')`,
						{
							methodInfo: {
								className: 'Base',
								methodName: 'handleEvent',
							},
							breakpointId: sinon.match.string,
							breakpoints: bps,
						}
					);
					sinon.assert.calledWith(clientSendSpy, JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: childNodePath,
						methodName: 'handleEvent',
						nodeName: childNodeName,
						nodeParent: rootNodeName,
						condition: '',
						success: true,
					}));
				});

				it('should place a breakpoint with an additional condition', async function() {
					clientMock.emit('message', JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: childNodePath,
						methodName: 'handleEvent',
						condition,
					}));
					// this is required to get over the promises that happen in the async callback when we emit message above
					await EventEmitter.once(clientMock, 'messageHandled');
					sinon.assert.notCalled(removeBreakpointHelperStub);
					const bps = new Map();
					bps.set(childNodePath, {
						nodePath: childNodePath,
						condition,
						nodeName: childNodeName,
						nodeParent: rootNodeName,
					});
					sinon.assert.calledWith(setBreakpointHelperStub,
						sinon.match.object,
						sinon.match.string,
						`(this.path === '${childNodePath}' && ${condition})`,
						{
							methodInfo: {
								className: 'Base',
								methodName: 'handleEvent',
							},
							breakpointId: sinon.match.string,
							breakpoints: bps,
						}
					);
					sinon.assert.calledWith(clientSendSpy, JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: childNodePath,
						methodName: 'handleEvent',
						nodeName: childNodeName,
						nodeParent: rootNodeName,
						condition,
						success: true,
					}));
				});

				it('should place a breakpoint on a getter', async function() {
					clientMock.emit('message', JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: rootNodeName,
						methodName: 'get latched',
						condition: '',
					}));
					// this is required to get over the promises that happen in the async callback when we emit message above
					await EventEmitter.once(clientMock, 'messageHandled');
					sinon.assert.notCalled(removeBreakpointHelperStub);
					const bps = new Map();
					bps.set(rootNodeName, {
						nodePath: rootNodeName,
						condition: '',
						nodeName: rootNodeName,
						nodeParent: '',
					});
					sinon.assert.calledWith(setBreakpointHelperStub,
						sinon.match.object,
						sinon.match.string,
						`(this.path === '${rootNodeName}')`,
						{
							methodInfo: {
								className: 'Composite',
								methodName: 'get latched',
							},
							breakpointId: sinon.match.string,
							breakpoints: bps,
						}
					);
					sinon.assert.calledWith(clientSendSpy, JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: rootNodeName,
						methodName: 'get latched',
						nodeName: rootNodeName,
						nodeParent: '',
						condition: '',
						success: true,
					}));
				});
				it('should place a breakpoint on a getter with a getter/setter defined', async function() {
					clientMock.emit('message', JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: rootNodeName,
						methodName: 'get foo',
						condition: '',
					}));
					// this is required to get over the promises that happen in the async callback when we emit message above
					await EventEmitter.once(clientMock, 'messageHandled');
					sinon.assert.notCalled(removeBreakpointHelperStub);
					const bps = new Map();
					bps.set(rootNodeName, {
						nodePath: rootNodeName,
						condition: '',
						nodeName: rootNodeName,
						nodeParent: '',
					});
					sinon.assert.calledWith(setBreakpointHelperStub,
						sinon.match.object,
						sinon.match.string,
						`(this.path === '${rootNodeName}')`,
						{
							methodInfo: {
								className: 'SequenceWithSetter',
								methodName: 'get foo',
							},
							breakpointId: sinon.match.string,
							breakpoints: bps,
						}
					);
					sinon.assert.calledWith(clientSendSpy, JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: rootNodeName,
						methodName: 'get foo',
						nodeName: rootNodeName,
						nodeParent: '',
						condition: '',
						success: true,
					}));
				});
				it('should place a breakpoint on a setter', async function() {
					clientMock.emit('message', JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: rootNodeName,
						methodName: 'set setterOnlyProp',
						condition: '',
					}));
					// this is required to get over the promises that happen in the async callback when we emit message above
					await EventEmitter.once(clientMock, 'messageHandled');
					sinon.assert.notCalled(removeBreakpointHelperStub);
					const bps = new Map();
					bps.set(rootNodeName, {
						nodePath: rootNodeName,
						condition: '',
						nodeName: rootNodeName,
						nodeParent: '',
					});
					sinon.assert.calledWith(setBreakpointHelperStub,
						sinon.match.object,
						sinon.match.string,
						`(this.path === '${rootNodeName}')`,
						{
							methodInfo: {
								className: 'SequenceWithSetter',
								methodName: 'set setterOnlyProp',
							},
							breakpointId: sinon.match.string,
							breakpoints: bps,
						}
					);
					sinon.assert.calledWith(clientSendSpy, JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: rootNodeName,
						methodName: 'set setterOnlyProp',
						nodeName: rootNodeName,
						nodeParent: '',
						condition: '',
						success: true,
					}));
				});
				it('should place a 2nd breakpoint on the same function of another instance, same class', async function() {
					clientMock.emit('message', JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: childNodePath,
						methodName: 'handleEvent',
						condition: '',
					}));
					// this is required to get over the promises that happen in the async callback when we emit message above
					await EventEmitter.once(clientMock, 'messageHandled');
					removeBreakpointHelperStub.resetHistory();
					setBreakpointHelperStub.resetHistory();
					clientSendSpy.resetHistory();

					clientMock.emit('message', JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: rootNodeName,
						methodName: 'handleEvent',
						condition,
					}));
					// this is required to get over the promises that happen in the async callback when we emit message above
					await EventEmitter.once(clientMock, 'messageHandled');

					sinon.assert.called(removeBreakpointHelperStub);
					const bps = new Map();
					bps.set(childNodePath, {
						nodePath: childNodePath,
						condition: '',
						nodeName: childNodeName,
						nodeParent: rootNodeName,
					});
					bps.set(rootNodeName, {
						nodePath: rootNodeName,
						condition,
						nodeName: rootNodeName,
						nodeParent: '',
					});
					sinon.assert.calledWith(setBreakpointHelperStub,
						sinon.match.object,
						sinon.match.string,
						`(this.path === '${childNodePath}') || (this.path === '${rootNodeName}' && ${condition})`,
						{
							methodInfo: {
								className: 'Base',
								methodName: 'handleEvent',
							},
							breakpointId: sinon.match.string,
							breakpoints: bps,
						}
					);
					sinon.assert.calledWith(clientSendSpy, JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: rootNodeName,
						methodName: 'handleEvent',
						nodeName: rootNodeName,
						nodeParent: '',
						condition,
						success: true,
					}));
				});
				it('should place a 2nd breakpoint on the same function of another instance, different class', async function() {
					clientMock.emit('message', JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: childNodePath,
						methodName: '_beforeEvent',
						condition: '',
					}));
					// this is required to get over the promises that happen in the async callback when we emit message above
					await EventEmitter.once(clientMock, 'messageHandled');
					removeBreakpointHelperStub.resetHistory();
					setBreakpointHelperStub.resetHistory();
					clientSendSpy.resetHistory();

					clientMock.emit('message', JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: rootNodeName,
						methodName: '_beforeEvent',
						condition: '',
					}));
					// this is required to get over the promises that happen in the async callback when we emit message above
					await EventEmitter.once(clientMock, 'messageHandled');

					sinon.assert.notCalled(removeBreakpointHelperStub);
					const bps = new Map();
					bps.set(rootNodeName, {
						nodePath: rootNodeName,
						condition: '',
						nodeName: rootNodeName,
						nodeParent: '',
					});
					sinon.assert.calledWith(setBreakpointHelperStub,
						sinon.match.object,
						sinon.match.string,
						`(this.path === '${rootNodeName}')`,
						{
							methodInfo: {
								className: 'Composite',
								methodName: '_beforeEvent',
							},
							breakpointId: sinon.match.string,
							breakpoints: bps,
						}
					);
					sinon.assert.calledWith(clientSendSpy, JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: rootNodeName,
						methodName: '_beforeEvent',
						nodeName: rootNodeName,
						nodeParent: '',
						condition: '',
						success: true,
					}));
				});
				it('should update the condition on an existing breakpoint', async function() {
					clientMock.emit('message', JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: childNodePath,
						methodName: 'handleEvent',
						condition: '',
					}));
					// this is required to get over the promises that happen in the async callback when we emit message above
					await EventEmitter.once(clientMock, 'messageHandled');
					removeBreakpointHelperStub.resetHistory();
					setBreakpointHelperStub.resetHistory();
					clientSendSpy.resetHistory();

					// test adding the condition
					clientMock.emit('message', JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: childNodePath,
						methodName: 'handleEvent',
						condition,
					}));
					// this is required to get over the promises that happen in the async callback when we emit message above
					await EventEmitter.once(clientMock, 'messageHandled');

					sinon.assert.called(removeBreakpointHelperStub);
					const bps = new Map();
					bps.set(childNodePath, {
						nodePath: childNodePath,
						condition,
						nodeName: childNodeName,
						nodeParent: rootNodeName,
					});
					sinon.assert.calledWith(setBreakpointHelperStub,
						sinon.match.object,
						sinon.match.string,
						`(this.path === '${childNodePath}' && ${condition})`,
						{
							methodInfo: {
								className: 'Base',
								methodName: 'handleEvent',
							},
							breakpointId: sinon.match.string,
							breakpoints: bps,
						}
					);
					sinon.assert.calledWith(clientSendSpy, JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: childNodePath,
						methodName: 'handleEvent',
						nodeName: childNodeName,
						nodeParent: rootNodeName,
						condition,
						success: true,
					}));
					removeBreakpointHelperStub.resetHistory();
					setBreakpointHelperStub.resetHistory();
					clientSendSpy.resetHistory();

					// test removing the condition
					clientMock.emit('message', JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: childNodePath,
						methodName: 'handleEvent',
						condition: '',
					}));
					// this is required to get over the promises that happen in the async callback when we emit message above
					await EventEmitter.once(clientMock, 'messageHandled');

					sinon.assert.called(removeBreakpointHelperStub);
					bps.get(childNodePath).condition = '';
					sinon.assert.calledWith(setBreakpointHelperStub,
						sinon.match.object,
						sinon.match.string,
						`(this.path === '${childNodePath}')`,
						{
							methodInfo: {
								className: 'Base',
								methodName: 'handleEvent',
							},
							breakpointId: sinon.match.string,
							breakpoints: bps,
						}
					);
					sinon.assert.calledWith(clientSendSpy, JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: childNodePath,
						methodName: 'handleEvent',
						nodeName: childNodeName,
						nodeParent: rootNodeName,
						condition: '',
						success: true,
					}));
				});

				describe('placeBreakpoint error cases', function() {
					it('should fail to place a breakpoint for node that does not exist', async function() {
						clientMock.emit('message', JSON.stringify({
							request: 'placeBreakpoint',
							nodePath: 'foo',
							methodName: 'handleEvent',
							condition: '',
						}));
						// this is required to get over the promises that happen in the async callback when we emit message above
						await EventEmitter.once(clientMock, 'messageHandled');
						sinon.assert.notCalled(removeBreakpointHelperStub);
						sinon.assert.notCalled(setBreakpointHelperStub);
						sinon.assert.calledWith(clientSendSpy, JSON.stringify({
							request: 'placeBreakpoint',
							methodName: 'handleEvent',
							condition: '',
							success: false,
						}));
					});
					it('should fail to place a breakpoint for a method that does not exist on the node', async function() {
						clientMock.emit('message', JSON.stringify({
							request: 'placeBreakpoint',
							nodePath: childNodePath,
							methodName: 'foo',
							condition: '',
						}));
						// this is required to get over the promises that happen in the async callback when we emit message above
						await EventEmitter.once(clientMock, 'messageHandled');
						sinon.assert.notCalled(removeBreakpointHelperStub);
						sinon.assert.notCalled(setBreakpointHelperStub);
						sinon.assert.calledWith(clientSendSpy, JSON.stringify({
							request: 'placeBreakpoint',
							nodePath: childNodePath,
							methodName: 'foo',
							nodeName: childNodeName,
							nodeParent: rootNodeName,
							condition: '',
							success: false,
						}));
					});
					it('should fail to place the same breakpoint a second time with no condition', async function() {
						clientMock.emit('message', JSON.stringify({
							request: 'placeBreakpoint',
							nodePath: childNodePath,
							methodName: 'handleEvent',
							condition: '',
						}));
						// this is required to get over the promises that happen in the async callback when we emit message above
						await EventEmitter.once(clientMock, 'messageHandled');
						removeBreakpointHelperStub.resetHistory();
						setBreakpointHelperStub.resetHistory();
						clientSendSpy.resetHistory();

						// try setting the breakpoint again
						clientMock.emit('message', JSON.stringify({
							request: 'placeBreakpoint',
							nodePath: childNodePath,
							methodName: 'handleEvent',
							condition: '',
						}));
						// this is required to get over the promises that happen in the async callback when we emit message above
						await EventEmitter.once(clientMock, 'messageHandled');
						sinon.assert.notCalled(removeBreakpointHelperStub);
						sinon.assert.notCalled(setBreakpointHelperStub);
						sinon.assert.calledWith(clientSendSpy, JSON.stringify({
							request: 'placeBreakpoint',
							nodePath: childNodePath,
							methodName: 'handleEvent',
							nodeName: childNodeName,
							nodeParent: rootNodeName,
							condition: '',
							success: false,
						}));
					});
					it('should fail to place the same breakpoint a second time with the same condition', async function() {
						clientMock.emit('message', JSON.stringify({
							request: 'placeBreakpoint',
							nodePath: childNodePath,
							methodName: 'handleEvent',
							condition,
						}));
						// this is required to get over the promises that happen in the async callback when we emit message above
						await EventEmitter.once(clientMock, 'messageHandled');
						removeBreakpointHelperStub.resetHistory();
						setBreakpointHelperStub.resetHistory();
						clientSendSpy.resetHistory();

						// try setting the breakpoint again
						clientMock.emit('message', JSON.stringify({
							request: 'placeBreakpoint',
							nodePath: childNodePath,
							methodName: 'handleEvent',
							condition,
						}));
						// this is required to get over the promises that happen in the async callback when we emit message above
						await EventEmitter.once(clientMock, 'messageHandled');
						sinon.assert.notCalled(removeBreakpointHelperStub);
						sinon.assert.notCalled(setBreakpointHelperStub);
						sinon.assert.calledWith(clientSendSpy, JSON.stringify({
							request: 'placeBreakpoint',
							nodePath: childNodePath,
							methodName: 'handleEvent',
							nodeName: childNodeName,
							nodeParent: rootNodeName,
							condition,
							success: false,
						}));
					});
				});
			});

			describe('removeBreakpoint', function() {
				it('should remove a breakpoint when only one is set on the class/method', async function() {
					clientMock.emit('message', JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: childNodePath,
						methodName: 'handleEvent',
						condition: '',
					}));
					// this is required to get over the promises that happen in the async callback when we emit message above
					await EventEmitter.once(clientMock, 'messageHandled');
					removeBreakpointHelperStub.resetHistory();
					setBreakpointHelperStub.resetHistory();
					clientSendSpy.resetHistory();

					// remove the breakpoint
					clientMock.emit('message', JSON.stringify({
						request: 'removeBreakpoint',
						nodePath: childNodePath,
						methodName: 'handleEvent',
					}));
					// this is required to get over the promises that happen in the async callback when we emit message above
					await EventEmitter.once(clientMock, 'messageHandled');

					const bps = new Map();
					bps.set(childNodePath, {
						nodePath: childNodePath,
						condition: '',
						nodeName: childNodeName,
						nodeParent: rootNodeName,
					});
					sinon.assert.calledWith(removeBreakpointHelperStub,
						sinon.match.object,
						{
							methodInfo: {
								className: 'Base',
								methodName: 'handleEvent',
							},
							breakpointId: sinon.match.string,
							breakpoints: new Map(),
						},
					);
					sinon.assert.notCalled(setBreakpointHelperStub);
					sinon.assert.calledWith(clientSendSpy, JSON.stringify({
						request: 'removeBreakpoint',
						nodePath: childNodePath,
						methodName: 'handleEvent',
						success: true,
					}));
				});
				it('should remove a breakpoint for the specified node when more than one is set on the class/method',
					async function() {
						clientMock.emit('message', JSON.stringify({
							request: 'placeBreakpoint',
							nodePath: childNodePath,
							methodName: 'handleEvent',
							condition: '',
						}));
						// this is required to get over the promises that happen in the async callback when we emit message above
						await EventEmitter.once(clientMock, 'messageHandled');
						clientMock.emit('message', JSON.stringify({
							request: 'placeBreakpoint',
							nodePath: rootNodeName,
							methodName: 'handleEvent',
							condition: '',
						}));
						// this is required to get over the promises that happen in the async callback when we emit message above
						await EventEmitter.once(clientMock, 'messageHandled');
						removeBreakpointHelperStub.resetHistory();
						setBreakpointHelperStub.resetHistory();
						clientSendSpy.resetHistory();

						// remove one of the two breakpoints (one on the root node)
						clientMock.emit('message', JSON.stringify({
							request: 'removeBreakpoint',
							nodePath: rootNodeName,
							methodName: 'handleEvent',
						}));
						// this is required to get over the promises that happen in the async callback when we emit message above
						await EventEmitter.once(clientMock, 'messageHandled');

						const bps = new Map();
						bps.set(childNodePath, {
							nodePath: childNodePath,
							condition: '',
							nodeName: childNodeName,
							nodeParent: rootNodeName,
						});
						sinon.assert.calledWith(removeBreakpointHelperStub,
							sinon.match.object,
							{
								methodInfo: {
									className: 'Base',
									methodName: 'handleEvent',
								},
								breakpointId: sinon.match.string,
								breakpoints: bps,
							},
						);
						sinon.assert.calledWith(setBreakpointHelperStub,
							sinon.match.object,
							sinon.match.string,
							`(this.path === '${childNodePath}')`,
							{
								methodInfo: {
									className: 'Base',
									methodName: 'handleEvent',
								},
								breakpointId: sinon.match.string,
								breakpoints: bps,
							}
						);
						sinon.assert.calledWith(clientSendSpy, JSON.stringify({
							request: 'removeBreakpoint',
							nodePath: rootNodeName,
							methodName: 'handleEvent',
							success: true,
						}));
					});
				describe('removeBreakpoint error cases', function() {
					it('should fail to remove a breakpoint on a node that does not exist', async function() {
						clientMock.emit('message', JSON.stringify({
							request: 'removeBreakpoint',
							nodePath: 'foo',
							methodName: 'handleEvent',
						}));
						// this is required to get over the promises that happen in the async callback when we emit message above
						await EventEmitter.once(clientMock, 'messageHandled');
						sinon.assert.notCalled(removeBreakpointHelperStub);
						sinon.assert.calledWith(clientSendSpy, JSON.stringify({
							request: 'removeBreakpoint',
							methodName: 'handleEvent',
							success: false,
						}));
					});
					it('should fail to remove a breakpoint on a method that does not exist on the node', async function() {
						clientMock.emit('message', JSON.stringify({
							request: 'removeBreakpoint',
							nodePath: childNodePath,
							methodName: 'foo',
						}));
						// this is required to get over the promises that happen in the async callback when we emit message above
						await EventEmitter.once(clientMock, 'messageHandled');
						sinon.assert.notCalled(removeBreakpointHelperStub);
						sinon.assert.calledWith(clientSendSpy, JSON.stringify({
							request: 'removeBreakpoint',
							nodePath: childNodePath,
							methodName: 'foo',
							success: false,
						}));
					});
					it('should fail to remove a breakpoint that is set, but not for this node', async function() {
						clientMock.emit('message', JSON.stringify({
							request: 'placeBreakpoint',
							nodePath: rootNodeName,
							methodName: 'handleEvent',
							condition: '',
						}));
						// this is required to get over the promises that happen in the async callback when we emit message above
						await EventEmitter.once(clientMock, 'messageHandled');
						removeBreakpointHelperStub.resetHistory();
						setBreakpointHelperStub.resetHistory();
						clientSendSpy.resetHistory();

						// try to remove a different breakpoint
						clientMock.emit('message', JSON.stringify({
							request: 'removeBreakpoint',
							nodePath: childNodePath,
							methodName: 'handleEvent',
						}));
						// this is required to get over the promises that happen in the async callback when we emit message above
						await EventEmitter.once(clientMock, 'messageHandled');
						sinon.assert.notCalled(removeBreakpointHelperStub);
						sinon.assert.calledWith(clientSendSpy, JSON.stringify({
							request: 'removeBreakpoint',
							nodePath: childNodePath,
							methodName: 'handleEvent',
							success: false,
						}));
					});
					it('should fail to remove a breakpoint that is not set at all', async function() {
						// remove the breakpoint
						clientMock.emit('message', JSON.stringify({
							request: 'removeBreakpoint',
							nodePath: childNodePath,
							methodName: 'handleEvent',
						}));
						// this is required to get over the promises that happen in the async callback when we emit message above
						await EventEmitter.once(clientMock, 'messageHandled');
						sinon.assert.notCalled(removeBreakpointHelperStub);
						sinon.assert.calledWith(clientSendSpy, JSON.stringify({
							request: 'removeBreakpoint',
							nodePath: childNodePath,
							methodName: 'handleEvent',
							success: false,
						}));
					});
				});
			});

			describe('client reconnect', function() {
				it('should send any existing breakpoints back to the client when the client reconnects', async function() {
					clientMock.emit('message', JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: childNodePath,
						methodName: 'handleEvent',
						condition: '',
					}));

					const placeBreakpointRespObj: any = (await EventEmitter.once(clientMock, 'messageHandled'))[0];
					assert.deepEqual(placeBreakpointRespObj, {
						request: 'placeBreakpoint',
						nodePath: childNodePath,
						methodName: 'handleEvent',
						nodeName: childNode.name,
						nodeParent: childNode.parent,
						condition: '',
						success: true
					});

					const reconnectingClient = new WebSocketClientMock();
					serverMock.emit('connection', reconnectingClient);

					// we should get the same breakpoint we set before with the first client
					assert.deepEqual(reconnectingClient.lastResponse, {
						request: 'placeBreakpoint',
						nodePath: childNodePath,
						methodName: 'handleEvent',
						nodeName: childNode.name,
						nodeParent: childNode.parent,
						condition: '',
						success: true
					});
				});
			});
		});

		describe('unknown request', function() {
			it('should report error if api function does not exist', async function() {
				clientMock.emit('message', JSON.stringify({
					request: 'foobar',
				}));

				sinon.assert.calledWith(clientSendSpy, JSON.stringify({
					request: 'foobar',
					success: false,
					err: new APIFunctionNotFound('foobar').message,
				}));
			});
		});
	});
});
