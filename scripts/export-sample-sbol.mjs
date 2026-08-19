import { mkdirSync, writeFileSync } from 'node:fs';
import { makeSbolObject } from '../src/projectUtils.js';

const project = {
  projectName: 'Independent Validation Example',
  sequence: 'TTGACAGCTAGCTCAGTCCTAGGTATAATGCTAGCATGCGT',
  annotations: [
    { id: 'p1', name: 'Promoter', type: 'Promoter', start: 1, end: 35, strand: '+', notes: 'Validation example' }
  ]
};

mkdirSync('validation-output', { recursive: true });
const output = makeSbolObject(project);
writeFileSync(
  'validation-output/example.sbol3.jsonld',
  JSON.stringify(output, null, 2),
  'utf8'
);
console.log('Wrote validation-output/example.sbol3.jsonld');
