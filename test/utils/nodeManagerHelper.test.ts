import 'mocha';
import * as sinon from 'sinon';
import {assert} from 'chai';
import {Session, Runtime, Debugger} from 'inspector';
import {NoFunctionObjectIdError, NoObjectIdError, RuntimeWrappers, Utils} from '../../lib/utils/nodeManagerHelper';
import { BreakpointInfo, BreakpointData, NodePathKey } from '../../lib/utils/nodeManagerTypes';

describe('nodeManagerHelper', function(){

describe('RuntimeWrappers', function(){
    let session: Session|undefined = undefined;

    beforeEach(function(){
        session = new Session();
    });

    describe('getObjectIdFromRuntimeEvaluate', function(){
        const key = 'foo';

        it('should return error if error present', async function(){
            const testError = new Error('test error');
            sinon.stub(session!, <any>'post')
                .withArgs(
                    'Runtime.evaluate',
                    {expression: `global.breakpointMethods.get('${key}')`},
                    sinon.match.func)
                .callsFake((functionString: string,
                    expression: Runtime.EvaluateParameterType,
                    callback: (err: Error, result: {result?: Runtime.RemoteObject})=>void
                )=>{
                    callback(testError, {});
                });

            const result = await RuntimeWrappers.getObjectIdFromRuntimeEvaluate(session!, key);
            assert.equal(result.err, testError);
            assert.isUndefined(result.objectId);
        });

        it('should return error if no objectId', async function(){
            sinon.stub(session!, <any>'post')
                .withArgs(
                    'Runtime.evaluate',
                    {expression: `global.breakpointMethods.get('${key}')`},
                    sinon.match.func)
                .callsFake((functionString: string,
                    expression: Runtime.EvaluateParameterType,
                    callback: (err: Error|null, result: {result?: Runtime.RemoteObject})=>void
                )=>{
                    callback(null, {result: {type:''}});
                });

            const result = await RuntimeWrappers.getObjectIdFromRuntimeEvaluate(session!, key);
            assert.instanceOf(result.err, NoObjectIdError);
            assert.isUndefined(result.objectId);
        });

        it('should succeed if objectId exists', async function(){
            sinon.stub(session!, <any>'post')
                .withArgs(
                    'Runtime.evaluate',
                    {expression: `global.breakpointMethods.get('${key}')`},
                    sinon.match.func)
                .callsFake((functionString: string,
                    expression: Runtime.EvaluateParameterType,
                    callback: (err: Error|null, result: {result?: Runtime.RemoteObject})=>void
                )=>{
                    callback(null, {result: {type:'', objectId: 'foobar'}});
                });

            const result = await RuntimeWrappers.getObjectIdFromRuntimeEvaluate(session!, key);
            assert.isNull(result.err);
            assert.equal(result.objectId, 'foobar');
        });
    });

    describe('getFunctionObjectIdFromRuntimeProperties', function(){
        const objectId = "mockObjectId";
        const functionObjectId = "mockFunctionObjectId";
        it('should error if Runtime.getProperties has error', async function(){
            const errMsg = "test error";
            sinon.stub(session!, <any>'post')
            .withArgs(
                'Runtime.getProperties',
                {
                    objectId
                },
                sinon.match.func)
            .callsFake((functionString: string,
                params: {},
                callback: (err: Error|null, result: Runtime.GetPropertiesReturnType)=>void
            )=>{
                callback(new Error(errMsg), {result: []});
            });

            const result = await RuntimeWrappers.getFunctionObjectIdFromRuntimeProperties(session!, objectId);
            assert.equal(errMsg, result.err!.message);
            assert.isUndefined(result.functionObjectId);
        });

        it('should error if Runtime.getProperties throw error when accessing function object id ', async function(){
            sinon.stub(session!, <any>'post')
            .withArgs(
                'Runtime.getProperties',
                {
                    objectId
                },
                sinon.match.func)
            .callsFake((functionString: string,
                params: {},
                callback: (err: Error|null, result: Runtime.GetPropertiesReturnType)=>void
            )=>{
                callback(null, {result: []});
            });

            const result = await RuntimeWrappers.getFunctionObjectIdFromRuntimeProperties(session!, objectId);
            assert.instanceOf(result.err, NoFunctionObjectIdError);
            assert.isUndefined(result.functionObjectId);
        });

        it('should error if Runtime.getProperties has no function object id ', async function(){
            sinon.stub(session!, <any>'post')
            .withArgs(
                'Runtime.getProperties',
                {
                    objectId
                },
                sinon.match.func)
            .callsFake((functionString: string,
                params: {},
                callback: (err: Error|null, result: Runtime.GetPropertiesReturnType)=>void
            )=>{
                callback(null, {
                    result: [],
                    internalProperties: [{ name: '', value: { type: '' } }]
                });
            });

            const result = await RuntimeWrappers.getFunctionObjectIdFromRuntimeProperties(session!, objectId);
            assert.instanceOf(result.err, NoFunctionObjectIdError);
            assert.isUndefined(result.functionObjectId);
        });

        it('should return functionObjectId', async function(){
            sinon.stub(session!, <any>'post')
            .withArgs(
                'Runtime.getProperties',
                {
                    objectId
                },
                sinon.match.func)
            .callsFake((functionString: string,
                params: {},
                callback: (err: Error|null, result: Runtime.GetPropertiesReturnType)=>void
            )=>{
                callback(null, {
                    result: [],
                    internalProperties: [{ name: '', value: { type: '', objectId: functionObjectId } }]
                });
            });

            const result = await RuntimeWrappers.getFunctionObjectIdFromRuntimeProperties(session!, objectId);
            assert.isNull(result.err);
            assert.equal(result.functionObjectId, functionObjectId);
        });
    });

    describe('setBreakpointOnFunctionCall', function(){
        const functionObjectId = 'foo';
        const mockBreakpointId = 'qwerty123';
        let breakpointInfo: BreakpointInfo;

        beforeEach(function(){
            breakpointInfo = {
                methodInfo: {
                    className: 'myClass',
                    methodName: 'myMethod'
                },
                breakpointId: undefined,
                breakpoints: new Map<NodePathKey, BreakpointData>()
            };
        });

        it('should return false if Debugger.setBreakpointOnFunctionCall has error', async function(){
            sinon.stub(session!, <any>'post')
                .withArgs(
                    'Debugger.setBreakpointOnFunctionCall',
                    {
                        objectId: functionObjectId,
                        condition: ""
                    },
                    sinon.match.func)
                .callsFake((functionString: string,
                    params: {},
                    callback: (err: Error|null, result: {breakpointId?: string}|undefined)=>void
                )=>{
                    callback(new Error('test error'), undefined);
                });

            const success = await RuntimeWrappers.setBreakpointOnFunctionCall(session!, functionObjectId, "", breakpointInfo);
            assert.isFalse(success);
        });

        it('should return false if Debugger.setBreakpointOnFunctionCall has empty result', async function(){
            sinon.stub(session!, <any>'post')
                .withArgs(
                    'Debugger.setBreakpointOnFunctionCall',
                    {
                        objectId: functionObjectId,
                        condition: ""
                    },
                    sinon.match.func)
                .callsFake((functionString: string,
                    params: {},
                    callback: (err: Error|null, result: {breakpointId?: string}|undefined)=>void
                )=>{
                    callback(null, undefined);
                });

            const success = await RuntimeWrappers.setBreakpointOnFunctionCall(session!, functionObjectId, "", breakpointInfo);
            assert.isFalse(success);
        });

        it('should return false if Debugger.setBreakpointOnFunctionCall has no breakpoind id', async function(){
            sinon.stub(session!, <any>'post')
                .withArgs(
                    'Debugger.setBreakpointOnFunctionCall',
                    {
                        objectId: functionObjectId,
                        condition: ""
                    },
                    sinon.match.func)
                .callsFake((functionString: string,
                    params: {},
                    callback: (err: Error|null, result: {breakpointId?: string}|undefined)=>void
                )=>{
                    callback(null, {});
                });

            const success = await RuntimeWrappers.setBreakpointOnFunctionCall(session!, functionObjectId, "", breakpointInfo);
            assert.isFalse(success);
        });

        it('should return true if breakpoint set successfully', async function(){
            sinon.stub(session!, <any>'post')
                .withArgs(
                    'Debugger.setBreakpointOnFunctionCall',
                    {
                        objectId: functionObjectId,
                        condition: ""
                    },
                    sinon.match.func)
                .callsFake((functionString: string,
                    params: {},
                    callback: (err: Error|null, result: {breakpointId?: string})=>void
                )=>{
                    callback(null, {breakpointId: mockBreakpointId});
                });

            const success = await RuntimeWrappers.setBreakpointOnFunctionCall(session!, functionObjectId, "", breakpointInfo);
            assert.isTrue(success);
            assert.equal(breakpointInfo.breakpointId, mockBreakpointId);
        });
    });

    describe('removeBreakpointFromFunction', function(){
        let breakpointInfo: BreakpointInfo;

        beforeEach(function(){
            breakpointInfo = {
                methodInfo: {
                    className: 'myClass',
                    methodName: 'myMethod'
                },
                breakpointId: "mockBreakpointId",
                breakpoints: new Map<NodePathKey, BreakpointData>()
            };
        });

        it('should return false if remove breakpoint has error', async function(){
            sinon.stub(session!, <any>'post')
            .withArgs(
                'Debugger.removeBreakpoint',
                {
                    breakpointId: breakpointInfo.breakpointId
                },
                sinon.match.func)
            .callsFake((functionString: string,
                params: Debugger.RemoveBreakpointParameterType,
                callback: (err: Error|null)=>void
            )=>{
                callback(new Error('mock error'));
            });

            const success = await RuntimeWrappers.removeBreakpointFromFunction(
                session!, breakpointInfo);
            assert.isFalse(success);
        });

        it('should return true if remove breakpoint was successful', async function(){
            sinon.stub(session!, <any>'post')
            .withArgs(
                'Debugger.removeBreakpoint',
                {
                    breakpointId: breakpointInfo.breakpointId
                },
                sinon.match.func)
            .callsFake((functionString: string,
                params: Debugger.RemoveBreakpointParameterType,
                callback: (err: Error|null)=>void
            )=>{
                callback(null);
            });

            const success = await RuntimeWrappers.removeBreakpointFromFunction(
                session!, breakpointInfo);
            assert.isTrue(success);
        });
    });
});

describe('Utils', function(){
    describe('createConditionString', function(){
        it('should create string with one breakpoint and no condition', function(){
            const breakpointData: BreakpointData = {
                nodePath: 'foo_bar',
            };
            const conditionString = Utils.createConditionString([breakpointData]);
            assert.equal(conditionString, `(this.path === '${breakpointData.nodePath}')`);
        });

        it('should create string with one breakpoint and condition', function(){
            const breakpointData: BreakpointData = {
                nodePath: 'foo_bar',
                condition: 'myVar === 123'
            };
            const conditionString = Utils.createConditionString([breakpointData]);
            assert.equal(conditionString, 
                `(this.path === '${breakpointData.nodePath}' && ${breakpointData.condition})`);
        });

        it('should create string with multiple breakpoints and no conditions', function(){
            const breakpointData1: BreakpointData = {
                nodePath: 'foo_bar',
            };
            const breakpointData2: BreakpointData = {
                nodePath: 'fizz_buzz',
            };

            const conditionString = Utils.createConditionString([breakpointData1, breakpointData2]);
            assert.equal(conditionString, 
                `(this.path === '${breakpointData1.nodePath}') || ` +
                `(this.path === '${breakpointData2.nodePath}')`
            );
        });

        it('should create string with multiple breakpoints and one condition', function(){
            const breakpointData1: BreakpointData = {
                nodePath: 'foo_bar',
                condition: 'myVar === 123'
            };
            const breakpointData2: BreakpointData = {
                nodePath: 'fizz_buzz',
            };

            const conditionString = Utils.createConditionString([breakpointData1, breakpointData2]);
            assert.equal(conditionString, 
                `(this.path === '${breakpointData1.nodePath}' && ${breakpointData1.condition}) || ` +
                `(this.path === '${breakpointData2.nodePath}')`
            );
        });

        it('should create string with multiple breakpoints and multiple conditions', function(){
            const breakpointData1: BreakpointData = {
                nodePath: 'foo_bar',
                condition: 'myVar === 123'
            };
            const breakpointData2: BreakpointData = {
                nodePath: 'fizz_buzz',
                condition: `otherVar === 'hello'`
            };

            const conditionString = Utils.createConditionString([breakpointData1, breakpointData2]);
            assert.equal(conditionString, 
                `(this.path === '${breakpointData1.nodePath}' && ${breakpointData1.condition}) || ` +
                `(this.path === '${breakpointData2.nodePath}' && ${breakpointData2.condition})`
            );
        });
    });

    describe('getMethodInfoForObject', function(){
        it('should give back an alphabetized list of methods with class', function(){
            class Foo {
                // should not work on member variables
                private baseVar:any;

                constructor() {}

                // should work on properties
                get getBaseProp():any{return 0;}
                set setBaseProp(i:any){i;}

                // should work on methods inherited from base class
                public inheritedMethod():void{}

                // should work on methods only in base class
                public baseMethod():void{}
            }

            class Bar extends Foo {
                // should not work on member variables
                private childVar:any;

                // should work on constructors
                constructor() {
                    super();
                }

                // should work on properties
                get getChildProp():any{return 0;}
                set setChildProp(i:any){i;}

                // should work on methods inherited from base class
                public inheritedMethod():void{}

                // should work on methods only in child class
                public childMethod():void{}

                // should work on private methods
                public privateChildMethod():void{}
            }

            const obj = new Bar();
            const methodInfo = Utils.getMethodInfoForObject(obj);
            assert.deepEqual(methodInfo, [
                { methodName: 'baseMethod', className: 'Foo' },
                { methodName: 'childMethod', className: 'Bar' },
                { methodName: 'constructor', className: 'Bar' },
                { methodName: 'getBaseProp', className: 'Foo' },
                { methodName: 'getChildProp', className: 'Bar' },
                { methodName: 'inheritedMethod', className: 'Bar' },
                { methodName: 'privateChildMethod', className: 'Bar' },
                { methodName: 'setBaseProp', className: 'Foo' },
                { methodName: 'setChildProp', className: 'Bar' },
            ]);
        });

    });
});

});
