import test from "node:test";
import assert from "node:assert/strict";
import {nativeFarmAgentPose,nativeFarmWorldPoses,FEET_TO_METRES} from "../src/upstream/farm-world/pose-adapter.mjs";

test("original farm x/y ground and z height convert to Three.js metres without mutation",()=>{
 const a={id:7,x:10,y:20,z:2,act:"drink",ref:{sp:"chicken"},path:[{x:12,y:20,z:2}],face:-1};
 const before=structuredClone(a);
 const p=nativeFarmAgentPose(a,{x:3,y:4,z:5});
 assert.equal(FEET_TO_METRES,0.3048);
 assert.deepEqual(p.position,{x:6.048,y:4.6096,z:11.096});
 assert.equal(p.action,"drink");
 assert.equal(p.moving,true);
 assert.deepEqual(a,before);
 assert.ok(Object.isFrozen(p));
});
test("original agent map retains individual identities and resting state",()=>{
 const poses=nativeFarmWorldPoses({agents:new Map([[1,{id:1,x:0,y:0,z:0,path:[],act:"rest"}],[2,{id:2,x:1,y:1,z:0,path:[{x:2,y:2}],act:"wander"}]])},{x:0,y:0,z:0});
 assert.deepEqual(poses.map(p=>p.id),["1","2"]);
 assert.deepEqual(poses.map(p=>p.moving),[false,true]);
});
test("invalid native coordinates fail closed",()=>{
 assert.throws(()=>nativeFarmAgentPose({id:1,x:NaN,y:0,z:0}),RangeError);
 assert.throws(()=>nativeFarmAgentPose({id:1,x:0,y:0,z:0},{x:Infinity,y:0,z:0}),RangeError);
});
