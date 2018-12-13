/**
 * 5/30/16
 * @author Joshua Chaitin-Pollak
 */
export const resultCodes: {[K in ResultCode]: ResultCode} = {
	SUCCESS: 'SUCCESS',
	FAILURE: 'FAILURE',
	RUNNING: 'RUNNING',
	ERROR: 'ERROR',
};
export type ResultCode = 'SUCCESS' | 'FAILURE' | 'RUNNING' | 'ERROR';