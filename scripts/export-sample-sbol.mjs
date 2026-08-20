import { mkdirSync, writeFileSync } from 'node:fs';

const SBOL = 'http://sbols.org/v3#';
const SBO_DNA = 'https://identifiers.org/SBO:0000251';
const IUPAC_DNA = 'https://identifiers.org/edam:format_1207';
const NAMESPACE = 'https://example.org';

const componentIdentity =
  `${NAMESPACE}/Independent_Validation_Example`;

const sequenceIdentity =
  `${NAMESPACE}/Independent_Validation_Example_sequence`;

const document = [
  {
    '@id': componentIdentity,
    '@type': [`${SBOL}Component`],

    [`${SBOL}hasNamespace`]: [
      { '@id': NAMESPACE }
    ],

    [`${SBOL}displayId`]: [
      { '@value': 'Independent_Validation_Example' }
    ],

    [`${SBOL}name`]: [
      { '@value': 'Independent Validation Example' }
    ],

    [`${SBOL}type`]: [
      { '@id': SBO_DNA }
    ],

    [`${SBOL}hasSequence`]: [
      { '@id': sequenceIdentity }
    ]
  },

  {
    '@id': sequenceIdentity,
    '@type': [`${SBOL}Sequence`],

    [`${SBOL}hasNamespace`]: [
      { '@id': NAMESPACE }
    ],

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