import {Runtime, Session, Debugger} from 'inspector';
import {promisify} from 'util';
import {
	ClassMethodNameKey,
	BreakpointInfo,
	BreakpointData,
	NodeMethodInfo,
} from './nodeManagerTypes';

export class NoObjectIdError extends Error {
	constructor(key: string) {
		super(`ObjectId did not exist for: ${key}`);
	}
}
export class NoFunctionObjectIdError extends Error {
	constructor(objectId: string) {
		super(`FunctionObjectId did not exist for: ${objectId}`);
	}
}

export class NoBreakpointForBreakpointError extends Error {
	constructor(functionObjectId: string) {
		super(`Got no result for function object id: ${functionObjectId}`);
	}
}

export class NoBreakpointIdForBreakpointError extends Error {
	constructor(functionObjectId: string) {
		super(`Got no breakpointId from result for function object id: ${functionObjectId}`);
	}
}

export class BreakPointIdRequiredError extends Error {
	constructor() {
		super('breakpointInfo.breakpointId is required');
	}
}


export namespace RuntimeWrappers {
	export async function getObjectIdFromRuntimeEvaluate(session: Session, key: ClassMethodNameKey) {
		const post =
	     promisify<'Runtime.evaluate', Runtime.EvaluateParameterType, Runtime.EvaluateReturnType>(
				 session.post.bind(session));
		const res = await post('Runtime.evaluate', {expression: `global.breakpointMethods.get('${key}')`});
		const objectId = res.result.objectId;
		if (!objectId) {
			throw new NoObjectIdError(key);
		}
		return objectId;
	}

	export async function getFunctionObjectIdFromRuntimeProperties(session: Session, objectId: string) {
		const post = promisify<
			'Runtime.getProperties',
			Runtime.GetPropertiesParameterType,
			Runtime.GetPropertiesReturnType
		>(session.post.bind(session));
		const res = await post('Runtime.getProperties', {objectId});
		const funcObjId = Array.isArray(res.internalProperties) ? res.internalProperties[0].value?.objectId : undefined;
		if (!funcObjId) {
			throw new NoFunctionObjectIdError(objectId);
		}
		return funcObjId;
	}

	// set the breakpoint in the Runtime Debugger
	export async function setBreakpointOnFunctionCall(
		session: Session,
		functionObjectId: string,
		condition: string,
		breakpointInfo: BreakpointInfo
	) {
		// HACK: types are not defined for Debugger.setBreakpointOnFunctionCall
		const post = promisify<string, any, any>(session.post.bind(session));
		const res = await post('Debugger.setBreakpointOnFunctionCall', {objectId: functionObjectId, condition});
		if (!res) {
			throw new NoBreakpointForBreakpointError(functionObjectId);
		}
		const breakpointId: string|undefined = (res as any).breakpointId;
		if (!breakpointId) {
			throw new NoBreakpointIdForBreakpointError(functionObjectId);
		}
		breakpointInfo.breakpointId = breakpointId;
	}

	export async function removeBreakpointFromFunction(session: Session, breakpointInfo: BreakpointInfo) {
		if (!breakpointInfo.breakpointId) {
			throw new BreakPointIdRequiredError();
		}
		const post = promisify<'Debugger.removeBreakpoint', Debugger.RemoveBreakpointParameterType, void>(
			session.post.bind(session));
		await post('Debugger.removeBreakpoint', {breakpointId: breakpointInfo.breakpointId});
	}
}

export namespace Utils {
	export function createConditionString(breakpointDataArray: Array<BreakpointData>): string {
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

	export function getMethodInfoForObject(obj: Object): NodeMethodInfo[] {
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
