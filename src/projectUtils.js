import { clean } from './sequenceUtils.js';

export const validateAnnotation = (annotation, sequenceLength) => {
  const start = Number(annotation?.start);
  const end = Number(annotation?.end);
  if (!Number.isInteger(start) || !Number.isInteger(end)) return { valid: false, error: 'Coordinates must be whole numbers' };
  if (start < 1 || end < start) return { valid: false, error: 'Invalid annotation coordinates' };
  if (end > sequenceLength) return { valid: false, error: 'Annotation exceeds sequence length' };
  return { valid: true, error: '' };
};

export const toFasta = (projectName, sequence) => `>${String(projectName || 'Untitled project').trim() || 'Untitled project'}\n${clean(sequence)}\n`;

export const parseFasta = (text = '') => {
  const lines = String(text).trim().split(/\r?\n/);
  if (!lines[0]?.startsWith('>')) throw new Error('Invalid FASTA: missing header');
  const sequence = clean(lines.slice(1).join(''));
  if (!sequence) throw new Error('Invalid FASTA: no DNA sequence');
  return { projectName: lines[0].slice(1).trim() || 'Imported FASTA', sequence };
};

export const makeProjectObject = ({ projectName, sequence, annotations = [], exportedAt = new Date().toISOString() }) => ({
  format: 'SBOL3-Sequence-Editor-Project',
  version: '1.0',
  projectName: projectName || 'Untitled project',
  sequence: clean(sequence),
  annotations,
  exportedAt
});

export const parseProjectObject = (data) => {
  if (!data || data.format !== 'SBOL3-Sequence-Editor-Project') throw new Error('Unsupported project format');
  return {
    projectName: data.projectName || 'Imported project',
    sequence: clean(data.sequence || ''),
    annotations: Array.isArray(data.annotations) ? data.annotations : []
  };
};

export const makeSbolObject = ({ projectName, sequence, annotations = [] }) => {
  const displayId = String(projectName || 'Untitled_Project').trim().replace(/\s+/g, '_');
  return {
    '@context': ['https://sbolstandard.org/ontology/v3.1.0/sbol_context.jsonld'],
    '@id': `https://example.org/${displayId}`,
    '@type': 'Component',
    displayId,
    name: projectName || 'Untitled Project',
    types: ['https://identifiers.org/SBO:0000251'],
    sequences: [{ '@type': 'Sequence', elements: clean(sequence), encoding: 'https://identifiers.org/edam:format_1207' }],
    features: annotations.map((a) => ({
      '@type': 'SequenceFeature', name: a.name, roles: [a.type],
      locations: [{ '@type': 'Range', start: Number(a.start), end: Number(a.end), orientation: a.strand === '+' ? 'inline' : 'reverseComplement' }],
      description: a.notes || ''
    }))
  };
};

export const parseSbolObject = (data) => ({
  projectName: data?.name || data?.displayId || 'Imported SBOL3 Project',
  sequence: clean(data?.sequences?.[0]?.elements || data?.elements || ''),
  annotations: (data?.features || []).map((x, i) => ({
    id: x.id || `imported-${i + 1}`,
    name: x.name || 'Imported feature', type: x.roles?.[0] || 'Miscellaneous',
    start: Number(x.locations?.[0]?.start || 1), end: Number(x.locations?.[0]?.end || 1),
    strand: x.locations?.[0]?.orientation === 'reverseComplement' ? '-' : '+', notes: x.description || ''
  }))
});
