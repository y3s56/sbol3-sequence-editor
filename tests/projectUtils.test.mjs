import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAnnotation, toFasta, parseFasta, makeProjectObject, parseProjectObject, makeSbolObject, parseSbolObject } from '../src/projectUtils.js';

const annotations=[{id:'a1',name:'Promoter',type:'Promoter',start:1,end:4,strand:'+',notes:'test'}];

test('annotation accepts a valid in-range feature',()=>assert.equal(validateAnnotation(annotations[0],8).valid,true));
test('annotation rejects an end beyond sequence length',()=>assert.equal(validateAnnotation({...annotations[0],end:9},8).valid,false));
test('annotation rejects reversed coordinates',()=>assert.equal(validateAnnotation({...annotations[0],start:5,end:4},8).valid,false));
test('FASTA export/import round-trip preserves name and cleaned sequence',()=>{
 const fasta=toFasta('Demo Construct','ac gt-n'); const parsed=parseFasta(fasta);
 assert.deepEqual(parsed,{projectName:'Demo Construct',sequence:'ACGTN'});
});
test('malformed FASTA without header is rejected',()=>assert.throws(()=>parseFasta('ACGT'),/missing header/));
test('project JSON round-trip preserves project state',()=>{
 const obj=makeProjectObject({projectName:'Demo',sequence:'acgt',annotations,exportedAt:'2026-08-19T00:00:00.000Z'});
 const parsed=parseProjectObject(obj); assert.equal(parsed.projectName,'Demo'); assert.equal(parsed.sequence,'ACGT'); assert.deepEqual(parsed.annotations,annotations);
});
test('unsupported project JSON is rejected',()=>assert.throws(()=>parseProjectObject({format:'other'}),/Unsupported/));
test('SBOL-oriented export/import round-trip preserves core sequence and feature coordinates',()=>{
 const sbol=makeSbolObject({projectName:'Demo Construct',sequence:'ACGTACGT',annotations}); const parsed=parseSbolObject(sbol);
 assert.equal(parsed.projectName,'Demo Construct'); assert.equal(parsed.sequence,'ACGTACGT'); assert.equal(parsed.annotations[0].start,1); assert.equal(parsed.annotations[0].end,4); assert.equal(parsed.annotations[0].strand,'+');
});
test('SBOL reverse orientation maps back to negative strand',()=>{
 const sbol=makeSbolObject({projectName:'Demo',sequence:'ACGT',annotations:[{...annotations[0],strand:'-'}]});
 assert.equal(parseSbolObject(sbol).annotations[0].strand,'-');
});
test('empty SBOL features import safely',()=>assert.deepEqual(parseSbolObject({name:'X',sequences:[{elements:'AC'}]}).annotations,[]));
