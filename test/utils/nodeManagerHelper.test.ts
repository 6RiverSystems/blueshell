import 'mocha';
import * as sinon from 'sinon';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const assert = chai.assert;
import {Session} from 'inspector';
import {
	BreakPointIdRequiredError,
	NoBreakpointForBreakpointError,
	NoBreakpointIdForBreakpointError,
	NoFunctionObjectIdError,
	NoObjectIdError,
	RuntimeWrappers,
	Utils,
} from '../../lib/utils/nodeManagerHelper';
import {
	BreakpointInfo,
	BreakpointData,
	NodePathKey,
} from '../../lib/utils/nodeManagerTypes';

describe('nodeManagerHelper', function() {
	describe('RuntimeWrappers', function() {
		let session: Session;

		beforeEach(function() {
			session = new Session();
		});
		afterEach(function() {
			sinon.reset();
		});

		describe('getObjectIdFromRuntimeEvaluate', function() {
			const key = 'foo';

			it('should throw error if error present', async function() {
				const testError = new Error('test error');
				sinon.stub(session, <any>'post').withArgs(	// HACK - types not well defined for post
					'Runtime.evaluate',
					{expression: `global.breakpointMethods.get('${key}')`},
					sinon.match.func,
				).callsFake((_method, _params, callback) => {
					callback(testError, {});
				});
				await assert.isRejected(RuntimeWrappers.getObjectIdFromRuntimeEvaluate(session!, key), testError.message);
			});

			it('should throw error if no objectId', async function() {
				sinon.stub(session, <any>'post').withArgs(
					'Runtime.evaluate',
					{expression: `global.breakpointMethods.get('${key}')`},
					sinon.match.func
				)
				.callsFake((_method, _params, callback) => {
					callback(null, {result: {type: ''}});
				});

				await assert.isRejected(
					RuntimeWrappers.getObjectIdFromRuntimeEvaluate(session!, key), new NoObjectIdError(key).message);
			});

			it('should succeed if objectId exists', async function() {
				sinon.stub(session, <any>'post').withArgs(
					'Runtime.evaluate',
					{expression: `global.breakpointMethods.get('${key}')`},
					sinon.match.func
				)
				.callsFake((_method, _params, callback) => {
					callback(null, {result: {type: '', objectId: 'foobar'}});
				});
				await assert.isFulfilled(
					RuntimeWrappers.getObjectIdFromRuntimeEvaluate(session!, key), 'foobar');
			});
		});

		describe('getFunctionObjectIdFromRuntimeProperties', function() {
			const objectId = 'mockObjectId';
			const functionObjectId = 'mockFunctionObjectId';
			it('should error if Runtime.getProperties has error', async function() {
				const errMsg = 'test error';
				sinon.stub(session!, <any>'post').withArgs(
					'Runtime.getProperties',
					{
						objectId,
					},
					sinon.match.func
				)
				.callsFake((_method, _params, callback) => {
					callback(new Error(errMsg), {});
				});

				await assert.isRejected(RuntimeWrappers.getFunctionObjectIdFromRuntimeProperties(
					session!,
					objectId
				), errMsg);
			});

			it('should error if Runtime.getProperties throw error when accessing function object id ', async function() {
				sinon.stub(session!, <any>'post').withArgs(
					'Runtime.getProperties',
					{
						objectId,
					},
					sinon.match.func
				)
				.callsFake((_method, _params, callback) => {
					callback(null, {result: []});
				});
				await assert.isRejected(RuntimeWrappers.getFunctionObjectIdFromRuntimeProperties(
					session!,
					objectId
				), new NoFunctionObjectIdError(objectId).message);
			});

			it('should error if Runtime.getProperties has no function object id ', async function() {
				sinon.stub(session!, <any>'post').withArgs(
					'Runtime.getProperties',
					{
						objectId,
					},
					sinon.match.func
				)
				.callsFake((_method, _params, callback) => {
					callback(null, {result: [], internalProperties: [{name: '', value: {type: ''}}]});
				});

				await assert.isRejected(RuntimeWrappers.getFunctionObjectIdFromRuntimeProperties(
					session!,
					objectId
				), new NoFunctionObjectIdError(objectId).message);
			});

			it('should return functionObjectId', async function() {
				sinon.stub(session!, <any>'post').withArgs(
					'Runtime.getProperties',
					{
						objectId,
					},
					sinon.match.func
				)
				.callsFake((_method, _params, callback) => {
					callback(null, {result: [], internalProperties: [{name: '', value: {type: '', objectId: functionObjectId}}]});
				});

				await assert.isFulfilled(RuntimeWrappers.getFunctionObjectIdFromRuntimeProperties(
						session!,
						objectId
				), functionObjectId);
			});
		});

		describe('setBreakpointOnFunctionCall', function() {
			const functionObjectId = 'foo';
			const mockBreakpointId = 'qwerty123';
			let breakpointInfo: BreakpointInfo;

			beforeEach(function() {
				breakpointInfo = {
					methodInfo: {
						className: 'myClass',
						methodName: 'myMethod',
					},
					breakpointId: undefined,
					breakpoints: new Map<NodePathKey, BreakpointData>(),
				};
			});

			it('should return reject if Debugger.setBreakpointOnFunctionCall has error', async function() {
				sinon.stub(session!, <any>'post').withArgs(
					'Debugger.setBreakpointOnFunctionCall',
					{
						objectId: functionObjectId,
						condition: '',
					},
					sinon.match.func
				)
				.callsFake((_method, _params, callback) => {
					callback(new Error('test error'), {});
				});

				await assert.isRejected(RuntimeWrappers.setBreakpointOnFunctionCall(
					session!,
					functionObjectId,
					'',
					breakpointInfo
				), 'test error');
			});

			it('should reject if Debugger.setBreakpointOnFunctionCall has empty result', async function() {
				sinon.stub(session!, <any>'post').withArgs(
					'Debugger.setBreakpointOnFunctionCall',
					{
						objectId: functionObjectId,
						condition: '',
					},
					sinon.match.func
				)
				.callsFake((_method, _params, callback) => {
					callback(null, undefined);
				});

				await assert.isRejected(RuntimeWrappers.setBreakpointOnFunctionCall(
					session!,
					functionObjectId,
					'',
					breakpointInfo
				), new NoBreakpointForBreakpointError(functionObjectId).message);
			});

			it('should reject if Debugger.setBreakpointOnFunctionCall has no breakpoind id', async function() {
				sinon.stub(session!, <any>'post').withArgs(
					'Debugger.setBreakpointOnFunctionCall',
					{
						objectId: functionObjectId,
						condition: '',
					},
					sinon.match.func
				)
				.callsFake((_method, _params, callback) => {
					callback(null, {});
				});

				await assert.isRejected(RuntimeWrappers.setBreakpointOnFunctionCall(
					session!,
					functionObjectId,
					'',
					breakpointInfo
				), new NoBreakpointIdForBreakpointError(functionObjectId).message);
			});

			it('should fulfill if breakpoint set successfully', async function() {
				sinon.stub(session!, <any>'post').withArgs(
					'Debugger.setBreakpointOnFunctionCall',
					{
						objectId: functionObjectId,
						condition: '',
					},
					sinon.match.func
				)
				.callsFake((_method, _params, callback) => {
					callback(null, {breakpointId: mockBreakpointId});
				});

				await assert.isFulfilled(RuntimeWrappers.setBreakpointOnFunctionCall(
					session!,
					functionObjectId,
					'',
					breakpointInfo
				));
				assert.equal(breakpointInfo.breakpointId, mockBreakpointId);
			});
		});

		describe('removeBreakpointFromFunction', function() {
			let breakpointInfo: BreakpointInfo;

			beforeEach(function() {
				breakpointInfo = {
					methodInfo: {
						className: 'myClass',
						methodName: 'myMethod',
					},
					breakpointId: 'mockBreakpointId',
					breakpoints: new Map<NodePathKey, BreakpointData>(),
				};
			});

			it('should throw if remove breakpoint was not passed a breakpointId', async function() {
				breakpointInfo.breakpointId = undefined;
				await assert.isRejected(RuntimeWrappers.removeBreakpointFromFunction(
					session!,
					breakpointInfo
				), new BreakPointIdRequiredError().message);
			});
			it('should throw if remove breakpoint has error', async function() {
				sinon.stub(session!, <any>'post').withArgs(
					'Debugger.removeBreakpoint',
					{
						breakpointId: breakpointInfo.breakpointId,
					},
					sinon.match.func
				)
				.callsFake((_method, _params, callback) => {
					callback(new Error('mock error'));
				});

				await assert.isRejected(RuntimeWrappers.removeBreakpointFromFunction(
					session!,
					breakpointInfo
				), 'mock error');
			});

			it('should resolve if remove breakpoint was successful', async function() {
				sinon.stub(session!, <any>'post').withArgs(
					'Debugger.removeBreakpoint',
					{
						breakpointId: breakpointInfo.breakpointId,
					},
					sinon.match.func
				)
				.callsFake((_method, _params, callback) => {
					callback(null);
				});

				await assert.isFulfilled(RuntimeWrappers.removeBreakpointFromFunction(
					session!,
					breakpointInfo
				));
			});
		});
	});

	describe('Utils', function() {
		describe('createConditionString', function() {
			it('should create string with one breakpoint and no condition', function() {
				const breakpointData: BreakpointData = {
					nodePath: 'foo_bar',
				};
				const conditionString = Utils.createConditionString([breakpointData]);
				assert.equal(
					conditionString,
					`(this.path === '${breakpointData.nodePath}')`
				);
			});

			it('should create string with one breakpoint and condition', function() {
				const breakpointData: BreakpointData = {
					nodePath: 'foo_bar',
					condition: 'myVar === 123',
				};
				const conditionString = Utils.createConditionString([breakpointData]);
				assert.equal(
					conditionString,
					`(this.path === '${breakpointData.nodePath}' && ${breakpointData.condition})`
				);
			});

			it('should create string with multiple breakpoints and no conditions', function() {
				const breakpointData1: BreakpointData = {
					nodePath: 'foo_bar',
				};
				const breakpointData2: BreakpointData = {
					nodePath: 'fizz_buzz',
				};

				const conditionString = Utils.createConditionString([
					breakpointData1,
					breakpointData2,
				]);
				assert.equal(
					conditionString,
					`(this.path === '${breakpointData1.nodePath}') || ` +
						`(this.path === '${breakpointData2.nodePath}')`
				);
			});

			it('should create string with multiple breakpoints and one condition', function() {
				const breakpointData1: BreakpointData = {
					nodePath: 'foo_bar',
					condition: 'myVar === 123',
				};
				const breakpointData2: BreakpointData = {
					nodePath: 'fizz_buzz',
				};

				const conditionString = Utils.createConditionString([
					breakpointData1,
					breakpointData2,
				]);
				assert.equal(
					conditionString,
					`(this.path === '${breakpointData1.nodePath}' && ${breakpointData1.condition}) || ` +
						`(this.path === '${breakpointData2.nodePath}')`
				);
			});

			it('should create string with multiple breakpoints and multiple conditions', function() {
				const breakpointData1: BreakpointData = {
					nodePath: 'foo_bar',
					condition: 'myVar === 123',
				};
				const breakpointData2: BreakpointData = {
					nodePath: 'fizz_buzz',
					condition: `otherVar === 'hello'`,
				};

				const conditionString = Utils.createConditionString([
					breakpointData1,
					breakpointData2,
				]);
				assert.equal(
					conditionString,
					`(this.path === '${breakpointData1.nodePath}' && ${breakpointData1.condition}) || ` +
						`(this.path === '${breakpointData2.nodePath}' && ${breakpointData2.condition})`
				);
			});
		});

		describe('getMethodInfoForObject', function() {
			it('should give back an alphabetized list of methods with class', function() {
				class Foo {
					// should not work on member variables
					private baseVar: any;

					constructor() {}

					// should work on properties
					get getBaseProp(): any {
						return 0;
					}
					set setBaseProp(i: any) {
						i;
					}

					// should work on methods inherited from base class
					public inheritedMethod(): void {}

					// should work on methods only in base class
					public baseMethod(): void {}
				}

				class Bar extends Foo {
					// should not work on member variables
					private childVar: any;

					// should work on constructors
					constructor() {
						super();
					}

					// should work on properties
					get getChildProp(): any {
						return 0;
					}
					set setChildProp(i: any) {
						i;
					}

					// should work on methods inherited from base class
					public inheritedMethod(): void {}

					// should work on methods only in child class
					public childMethod(): void {}

					// should work on private methods
					public privateChildMethod(): void {}
				}

				const obj = new Bar();
				const methodInfo = Utils.getMethodInfoForObject(obj);
				assert.deepEqual(methodInfo, [
					{methodName: 'baseMethod', className: 'Foo'},
					{methodName: 'childMethod', className: 'Bar'},
					{methodName: 'constructor', className: 'Bar'},
					{methodName: 'getBaseProp', className: 'Foo'},
					{methodName: 'getChildProp', className: 'Bar'},
					{methodName: 'inheritedMethod', className: 'Bar'},
					{methodName: 'privateChildMethod', className: 'Bar'},
					{methodName: 'setBaseProp', className: 'Foo'},
					{methodName: 'setChildProp', className: 'Bar'},
				]);
			});
		});
	});
});
