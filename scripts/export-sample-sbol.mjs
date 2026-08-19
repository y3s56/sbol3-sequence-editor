import { mkdirSync, writeFileSync } from 'node:fs';

const SBOL = 'http://sbols.org/v3#';
const SBO = 'https://identifiers.org/SBO:0000251';
const IUPAC_DNA = 'https://identifiers.org/edam:format_1207';

const sequenceIdentity =
  'https://example.org/Independent_Validation_Example_sequence';

const componentIdentity =
  'https://example.org/Independent_Validation_Example';

const document = [
  {
    '@id': componentIdentity,
    '@type': [`${SBOL}Component`],
    [`${SBOL}displayId`]: [
      { '@value': 'Independent_Validation_Example' }
    ],
    [`${SBOL}name`]: [
      { '@value': 'Independent Validation Example' }
    ],
    [`${SBOL}type`]: [
      { '@id': SBO }
    ],
    [`${SBOL}hasSequence`]: [
      { '@id': sequenceIdentity }
    ]
  },
  {
    '@id': sequenceIdentity,
    '@type': [`${SBOL}Sequence`],
    [`${SBOL}displayId`]: [
      { '@value': 'Independent_Validation_Example_sequence' }
    ],
    [`${SBOL}elements`]: [
      {
        '@value':
          'TTGACAGCTAGCTCAGTCCTAGGTATAATGCTAGCATGCGT'
      }
    ],
    [`${SBOL}encoding`]: [
      { '@id': IUPAC_DNA }
    ]
  }
];

mkdirSync('validation-output', { recursive: true });

writeFileSync(
  'validation-output/example.sbol3.jsonld',
  JSON.stringify(document, null, 2),
  'utf8'
);

console.log(
  'Wrote validation-output/example.sbol3.jsonld'
);