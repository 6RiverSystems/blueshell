import {Runtime, Session} from 'inspector';
import {
	ClassMethodNameKey,
	BreakpointInfo,
	BreakpointData,
	NodeMethodInfo,
} from './nodeManagerTypes';

/* eslint no-console: "off" */

export class NoObjectIdError extends Error {
	constructor(key: string) {
		super(`ObjectId did not exist for: ${key}`);
	}
}
export class NoFunctionObjectIdError extends Error {
	constructor(objectId: string, msg: string) {
		super(`FunctionObjectId did not exist for: ${objectId}. err msg: ${msg}`);
	}
}

export class RuntimeWrappers {
	// evaluate the function stored in the global cache in the debugger runtime in order to get an objectId
	public static async getObjectIdFromRuntimeEvaluate(session: Session, key: ClassMethodNameKey):
		Promise<{objectId: string|undefined, err: Error|null}> {
		return await new Promise((resolve) => {
			session.post('Runtime.evaluate', {expression: `global.breakpointMethods.get('${key}')`},
				(err, result: Runtime.EvaluateReturnType) => {
					if (err) {
						console.error(`RuntimeWrappers - getObjectIdFromRuntimeEvaluate\
						 - Error in Runtime.evaluate for: ${key}`, err);
						resolve({err, objectId: undefined});
					} else {
						if (!result.result.objectId) {
							const error = new NoObjectIdError(key);
							console.error(`RuntimeWrappers - getObjectIdFromRuntimeEvaluate - ${error.message}`);
							resolve({err: error, objectId: undefined});
						} else {
							const objectId: string = result.result.objectId as string;
							console.log(`RuntimeWrappers - getObjectIdFromRuntimeEvaluate -\
						got result from Runtime.evaluate for: ${key}. object id: ${objectId}`);
							resolve({err: null, objectId});
						}
					}
				});
		});
	}

	public static async getFunctionObjectIdFromRuntimeProperties(session: Session, objectId: string):
	 Promise<{functionObjectId: string|undefined, err: Error|null}> {
		return await new Promise((resolve) => {
			session.post('Runtime.getProperties', {objectId}, (err, result: Runtime.GetPropertiesReturnType) => {
				if (err) {
					console.error(`RuntimeWrappers - getFunctionIdFromRuntimeProperties -\
						Error in Runtime.getProperties for object id: ${objectId}`, err);
					resolve({err, functionObjectId: undefined});
				} else {
					try {
						const funcObjId = result.internalProperties![0].value!.objectId;
						if (!funcObjId) {
							console.error(`RuntimeWrappers - getFunctionIdFromRuntimeProperties -\
							Error getting functionObjectId from Runtime.getProperties for object id: ${objectId}`);
							resolve({
								err: new NoFunctionObjectIdError(objectId, 'No function object id'),
								functionObjectId: undefined});
						} else {
							console.log(`RuntimeWrappers - getFunctionIdFromRuntimeProperties -\
							got result from Runtime.getProperties for object id: ${objectId}. function id: ${funcObjId}`);
							resolve({err: null, functionObjectId: funcObjId});
						}
					} catch (err) {
						console.error(`RuntimeWrappers - getFunctionIdFromRuntimeProperties -\
						Error getting functionObjectId from Runtime.getProperties for object id: ${objectId}`);
						resolve({err: new NoFunctionObjectIdError(objectId, (err as Error).message), functionObjectId: undefined});
					}
				}
			});
		});
	}

	// set the breakpoint in the Runtime Debugger
	public static async setBreakpointOnFunctionCall(
		session: Session, functionObjectId: string, condition: string, breakpointInfo: BreakpointInfo):
		 Promise<boolean> {
		return await new Promise((resolve) => {
			session.post('Debugger.setBreakpointOnFunctionCall', {
				objectId: functionObjectId,
				condition,
			},
			(err, result) => {
				if (err) {
					console.error(`RuntimeWrappers - setBreakpointOnFunctionCall - Error in \
						Debugger.setBreakpointOnFunctionCall for function object id: ${functionObjectId}`, err);
					resolve(false);
				} else if (!result) {
					console.error(`RuntimeWrappers - setBreakpointOnFunctionCall - Got no result in \
						Debugger.setBreakpointOnFunctionCall for function object id: ${functionObjectId}`);
					resolve(false);
					return;
				} else if (!(result as any).breakpointId) {
					console.error(`RuntimeWrappers - setBreakpointOnFunctionCall - Got no breakpointId from result in\
						Debugger.setBreakpointOnFunctionCall for function object id: ${functionObjectId}`);
					resolve(false);
				} else {
					console.log(`RuntimeWrappers - setBreakpointOnFunctionCall -\
					 breakpoint set successfully for function object id: ${functionObjectId}`);
					breakpointInfo.breakpointId = (result as any).breakpointId; // HACK: types are not defined
					console.log(`RuntimeWrappers - setBreakpointOnFunctionCall -\
					 added breakpoint id: ${breakpointInfo.breakpointId}`);
					resolve(true);
				}
			});
		});
	}

	public static async removeBreakpointFromFunction(session: Session, breakpointInfo: BreakpointInfo): Promise<boolean> {
		const classMethodName = `${breakpointInfo.methodInfo.className}::${breakpointInfo.methodInfo.methodName}`;
		return await new Promise((resolve) => {
			session.post('Debugger.removeBreakpoint', {
				breakpointId: breakpointInfo.breakpointId,
			}, (err: Error|null) => {
				if (err) {
					console.error(`RuntimeWrappers - remove breakpoint - error removing breakpoint for\
                        class+method: ${classMethodName} breakpoint id: ${breakpointInfo.breakpointId}`, err);
					resolve(false);
				} else {
					console.log(`RuntimeWrappers - remove breakpoint - removed breakpoint successfully for\
                        class+method: ${classMethodName} breakpoind id: ${breakpointInfo.breakpointId}`);
					resolve(true);
				}
			});
		});
	}
}

export class Utils {
	public static createConditionString(breakpointDataArray: Array<BreakpointData>): string {
		// build up the condition for each node that has a breakpoint at this class/method
		let condition = '';
		breakpointDataArray.forEach((breakpointData, index: number) => {
			if (index > 0) {
				condition += ' || ';
			}
			condition +=
			`(this.path === '${breakpointData.nodePath}'` +
				(!!breakpointData.condition ? ` && ${breakpointData.condition}` : '')
				+ ')';
		});
		return condition;
	}

	public static getMethodInfoForObject(obj: Object): NodeMethodInfo[] {
		const setOfMethods: Set<string> = new Set();
		const methodsData: NodeMethodInfo[] = [];
		do {
			const methods = Object.getOwnPropertyNames(obj).filter((prop) => {
				const nodePropDescriptor = Object.getOwnPropertyDescriptor(obj, prop);
				// if the prop name is a getter or setter, if we simply just check that it's a function
				// that will end up invoking the getter or setter, which could lead to a crash
				if (nodePropDescriptor && (nodePropDescriptor.get || nodePropDescriptor.set)) {
					return true;
				}
				return typeof (obj as any)[prop] === 'function';
			});
			const className = obj.constructor.name;
			methods.forEach((methodName) => {
				// de-duplicate any inherited methods
				if (!setOfMethods.has(methodName)) {
					setOfMethods.add(methodName);
					methodsData.push({methodName, className});
				}
			});
			// climb up the inheritance tree until we get to Object
			obj = Object.getPrototypeOf(obj);
		} while (!!obj && obj.constructor.name !== 'Object');

		methodsData.sort((a, b) => {
			if (a.methodName < b.methodName) {
				return -1;
			}
			if (a.methodName > b.methodName) {
				return 1;
			}
			return 0;
		});
		return methodsData;
	}
}
