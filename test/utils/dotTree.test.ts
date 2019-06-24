import {Base} from '../../lib/nodes/Base';
import {ResultCodes} from '../../lib/utils/ResultCodes';
import * as TestActions from '../nodes/test/Actions';

import {
    getColor, 
    SuccessColor,
    FailureColor,
    RunningColor,
    ErrorColor
} from '../../lib/utils/dotTree';

import {assert} from 'chai';
let sinon = require('sinon');

describe("dotTree", function(){
    describe("getColor", function(){
        let node:Base<TestActions.BasicState> = null;
        let state = new TestActions.BasicState();

        beforeEach(function(){
            node = new Base<TestActions.BasicState>("root");
        });

        function verifyColor(node: Base<TestActions.BasicState>, resultCode: ResultCodes, expectedColor: string) {
            let onRunStub = sinon.stub(node, "onRun").callsFake(()=>{
                return Promise.resolve(resultCode);
            });

            return node.run(state)
            .then((result)=>{
                assert.equal(result, resultCode);
                let actualColor = getColor(node, state)
                assert.equal(actualColor, expectedColor);
                
                onRunStub.restore();    
            });
        }

        it("should return Error color", function(){
            debugger;
            return verifyColor(node, ResultCodes.ERROR, ErrorColor);
        });

        
        it("should return Success color", function(){
            return verifyColor(node, ResultCodes.SUCCESS, SuccessColor);
        });

        it("should return Running color", function(){
            return verifyColor(node, ResultCodes.RUNNING, RunningColor);
        });

        it("should return Failure color", function(){
            return verifyColor(node, ResultCodes.FAILURE, FailureColor);
        });

        it("should return no color", function(){
            return verifyColor(node, undefined, '');
        });
    });
});
