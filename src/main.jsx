import React, { useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { SeqViz } from 'seqviz';
import './styles.css';

import { clean, stats, rc } from './sequenceUtils.js';

import {
  validateAnnotation,
  toFasta,
  parseFasta,
  makeProjectObject,
  parseProjectObject,
  makeSbolObject,
  parseSbolObject
} from './projectUtils.js';

const EXAMPLE =
  'ATGCGTACGTTAGCTAGCTAGGCTAACCGTTAGCGATCGATCGGATCCGATGCTAGCTAGCTAA';

const save = (name, data, type = 'text/plain') => {
  const a = document.createElement('a');

  const url = URL.createObjectURL(
    new Blob([data], { type })
  );

  a.href = url;
  a.download = name;

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};

function App() {
  const [project, setProject] =
    useState('My Synthetic Biology Project');

  const [sequence, setSequence] =
    useState(EXAMPLE);

  const [annotations, setAnnotations] =
    useState([
      {
        id: crypto.randomUUID(),
        name: 'Example promoter',
        type: 'Promoter',
        start: 1,
        end: 16,
        strand: '+',
        notes: 'Demonstration annotation'
      }
    ]);

  const [tab, setTab] =
    useState('editor');

  const [dark, setDark] =
    useState(false);

  const [msg, setMsg] =
    useState('Ready');

  const [tutorial, setTutorial] =
    useState(false);

  const [history, setHistory] =
    useState([EXAMPLE]);

  const [hIndex, setHIndex] =
    useState(0);

  const fileRef = useRef(null);

  const st = useMemo(
    () => stats(sequence),
    [sequence]
  );

  const commit = value => {
    const cleaned = clean(value);

    const nextHistory =
      history.slice(0, hIndex + 1);

    nextHistory.push(cleaned);

    setSequence(cleaned);
    setHistory(nextHistory);
    setHIndex(nextHistory.length - 1);

    setMsg('Sequence updated');
  };

  const newProject = () => {
    setProject('Untitled SBOL3 Project');
    setSequence('');
    setAnnotations([]);

    setHistory(['']);
    setHIndex(0);

    setMsg('New project created');
  };

  const loadExample = () => {
    setProject('Example Genetic Construct');

    setSequence(EXAMPLE);

    setHistory([EXAMPLE]);
    setHIndex(0);

    setAnnotations([
      {
        id: crypto.randomUUID(),
        name: 'Promoter',
        type: 'Promoter',
        start: 1,
        end: 16,
        strand: '+',
        notes: 'Example promoter region'
      },
      {
        id: crypto.randomUUID(),
        name: 'Coding sequence',
        type: 'CDS',
        start: 17,
        end: 48,
        strand: '+',
        notes: 'Example coding region'
      }
    ]);

    setMsg('Example loaded');
  };

  const undo = () => {
    if (hIndex > 0) {
      const newIndex =
        hIndex - 1;

      setHIndex(newIndex);
      setSequence(history[newIndex]);

      setMsg('Undo completed');
    }
  };

  const redo = () => {
    if (hIndex < history.length - 1) {
      const newIndex =
        hIndex + 1;

      setHIndex(newIndex);
      setSequence(history[newIndex]);

      setMsg('Redo completed');
    }
  };

  const exportFasta = () => {
    save(
      `${project.replace(/\s+/g, '_')}.fasta`,
      toFasta(project, sequence),
      'text/plain'
    );

    setMsg('FASTA exported');
  };

  const exportProject = () => {
    const output =
      makeProjectObject({
        projectName: project,
        sequence,
        annotations
      });

    save(
      `${project.replace(/\s+/g, '_')}.json`,
      JSON.stringify(output, null, 2),
      'application/json'
    );

    setMsg('Project exported');
  };

  const exportSBOL = () => {
    const output =
      makeSbolObject({
        projectName: project,
        sequence,
        annotations
      });

    save(
      `${project.replace(/\s+/g, '_')}.sbol3.jsonld`,
      JSON.stringify(output, null, 2),
      'application/ld+json'
    );

    setMsg('SBOL3 JSON-LD exported');
  };

  const importFile = event => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      try {
        const text =
          String(reader.result || '');

        const lowerName =
          file.name.toLowerCase();

        /*
         * FASTA import
         */
        if (
          lowerName.match(/\.(fa|fasta)$/) ||
          text.trimStart().startsWith('>')
        ) {
          const data =
            parseFasta(text);

          setProject(data.projectName);
          setSequence(data.sequence);
          setAnnotations([]);

          setHistory([data.sequence]);
          setHIndex(0);

          setMsg('FASTA imported');

          return;
        }

        /*
         * JSON / SBOL import
         */
        const raw =
          JSON.parse(text);

        let data;
        let message;

        /*
         * Native application project
         */
        if (
          raw &&
          raw.format ===
            'SBOL3-Sequence-Editor-Project'
        ) {
          data =
            parseProjectObject(raw);

          message =
            'Project imported';
        } else {
          /*
           * Reject arbitrary JSON.
           *
           * Previously every other JSON object was
           * automatically treated as SBOL3.
           */
          const type =
            raw?.['@type'];

          const typeValues =
            Array.isArray(type)
              ? type
              : type
                ? [type]
                : [];

          const hasComponentType =
            typeValues.some(value =>
              String(value).includes(
                'Component'
              )
            );

          const looksLikeSBOL =
            Boolean(
              raw &&
              typeof raw === 'object' &&
              (
                hasComponentType ||
                Array.isArray(raw.sequences) ||
                Array.isArray(raw.features) ||
                typeof raw.elements ===
                  'string'
              )
            );

          if (!looksLikeSBOL) {
            throw new Error(
              'Unsupported JSON or SBOL3 format'
            );
          }

          data =
            parseSbolObject(raw);

          /*
           * Supported editor subset requires DNA.
           */
          if (!data.sequence) {
            throw new Error(
              'SBOL3 file contains no supported DNA sequence'
            );
          }

          message =
            'SBOL3 imported';
        }

        setProject(
          data.projectName
        );

        setSequence(
          data.sequence
        );

        setAnnotations(
          Array.isArray(data.annotations)
            ? data.annotations
            : []
        );

        setHistory([
          data.sequence
        ]);

        setHIndex(0);

        setMsg(message);
      } catch (error) {
        console.error(
          'Import error:',
          error
        );

        setMsg(
          `Import failed: ${
            error instanceof Error
              ? error.message
              : 'Unknown import error'
          }`
        );
      } finally {
        /*
         * Allows the same file to be selected again.
         */
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      setMsg(
        'Import failed: file could not be read'
      );

      event.target.value = '';
    };

    reader.readAsText(file);
  };

  const addAnnotation = event => {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );

    const start =
      Number(form.get('start'));

    const end =
      Number(form.get('end'));

    const validation =
      validateAnnotation(
        { start, end },
        sequence.length
      );

    if (!validation.valid) {
      setMsg(
        validation.error
      );

      return;
    }

    setAnnotations(previous => [
      ...previous,
      {
        id: crypto.randomUUID(),

        name:
          String(
            form.get('name') || ''
          ),

        type:
          String(
            form.get('type') ||
              'Miscellaneous'
          ),

        start,
        end,

        strand:
          String(
            form.get('strand') ||
              '+'
          ),

        notes:
          String(
            form.get('notes') ||
              ''
          )
      }
    ]);

    event.currentTarget.reset();

    setMsg(
      'Annotation added'
    );
  };

  const nav = [
    ['dashboard', 'Dashboard'],
    ['editor', 'DNA Editor'],
    [
      'annotations',
      'Annotation Manager'
    ],
    [
      'visualisation',
      'Visualisation'
    ],
    ['analysis', 'Analysis'],
    ['sbol', 'SBOL3 Manager']
  ];

  return (
    <div
      className={
        dark
          ? 'app dark'
          : 'app'
      }
    >
      <header className="topbar">
        <div>
          <p className="eyebrow">
            Standards-aware synthetic
            biology workspace
          </p>

          <h1>
            SBOL3 Sequence Editor
          </h1>
        </div>

        <div className="badge">
          JavaScript · React · SBOL3
        </div>
      </header>

      <section className="toolbar">
        {[
          [
            'Load Example',
            loadExample
          ],
          [
            'New Project',
            newProject
          ],
          [
            'Import FASTA / Project / SBOL3',
            () =>
              fileRef.current?.click()
          ],
          [
            'Export Project',
            exportProject
          ],
          [
            'Export SBOL3',
            exportSBOL
          ],
          [
            'Export FASTA',
            exportFasta
          ],
          [
            'Undo',
            undo
          ],
          [
            'Redo',
            redo
          ],
          [
            dark
              ? 'Light Mode'
              : 'Dark Mode',
            () =>
              setDark(
                previous =>
                  !previous
              )
          ],
          [
            'Tutorial',
            () =>
              setTutorial(true)
          ]
        ].map(([title, action]) => (
          <button
            key={title}
            type="button"
            onClick={action}
          >
            {title}
          </button>
        ))}

        <input
          ref={fileRef}
          type="file"
          accept=".fasta,.fa,.json,.jsonld,.sbol"
          hidden
          onChange={importFile}
        />
      </section>

      <div className="workspace">
        <aside className="sidebar">
          <div className="brand">
            <div className="dna">
              DNA
            </div>

            <div>
              <strong>
                Project Workspace
              </strong>

              <span>
                SBOL3 + SBOL Visual
              </span>
            </div>
          </div>

          <nav>
            {nav.map(
              ([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={
                    tab === id
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setTab(id)
                  }
                >
                  {label}
                </button>
              )
            )}
          </nav>

          <div className="status">
            <strong>
              Project status
            </strong>

            <span>
              {msg}
            </span>
          </div>
        </aside>

        <main>
          <section className="hero">
            <div>
              <p className="kicker">
                Current project
              </p>

              <input
                value={project}
                onChange={event =>
                  setProject(
                    event.target.value
                  )
                }
              />

              <p>
                Design, annotate,
                analyse and exchange
                DNA constructs in one
                browser-based
                environment.
              </p>
            </div>

            <div className="heroCode">
              ACGT
            </div>
          </section>

          <section className="stats">
            <article>
              <span>
                Sequence length
              </span>

              <strong>
                {st.n}
              </strong>

              <small>
                nucleotides
              </small>
            </article>

            <article>
              <span>
                Annotations
              </span>

              <strong>
                {annotations.length}
              </strong>

              <small>
                biological features
              </small>
            </article>

            <article>
              <span>
                GC content
              </span>

              <strong>
                {st.gc}%
              </strong>

              <small>
                G + C bases
              </small>
            </article>

            <article>
              <span>
                Validation
              </span>

              <strong>
                {sequence
                  ? 'Valid'
                  : 'Empty'}
              </strong>

              <small>
                ACGTN alphabet
              </small>
            </article>
          </section>

          {tab ===
            'dashboard' && (
            <section className="card">
              <p className="kicker">
                Project overview
              </p>

              <h2>
                Welcome to your
                synthetic biology
                workspace
              </h2>

              <div className="two">
                <ul>
                  <li>
                    Edit and validate
                    nucleotide sequences
                  </li>

                  <li>
                    Create biological
                    annotations
                  </li>

                  <li>
                    Review nucleotide
                    composition and GC
                    content
                  </li>

                  <li>
                    Import and export
                    FASTA, project JSON
                    and SBOL3 JSON-LD
                  </li>

                  <li>
                    Prepare constructs
                    for SBOL Visual
                    rendering
                  </li>
                </ul>

                <div className="highlight">
                  <b>
                    SBOL3-aware
                  </b>

                  <h3>
                    Interoperable
                    biological design
                    data
                  </h3>

                  <p>
                    The prototype maps
                    supported project
                    data to Component,
                    Sequence and
                    SequenceFeature
                    representations.
                  </p>
                </div>
              </div>
            </section>
          )}

          {tab ===
            'editor' && (
            <section className="card">
              <div className="head">
                <div>
                  <p className="kicker">
                    Core module
                  </p>

                  <h2>
                    DNA Editor
                  </h2>
                </div>

                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    commit(
                      rc(sequence)
                    )
                  }
                >
                  Reverse complement
                </button>
              </div>

              <textarea
                value={sequence}
                onChange={event =>
                  commit(
                    event.target.value
                  )
                }
                placeholder="Enter A, C, G, T or N"
                spellCheck="false"
              />

              <div className="bases">
                {Object.entries(
                  st.c
                ).map(
                  ([base, value]) => (
                    <div key={base}>
                      <b>
                        {base}
                      </b>

                      <span>
                        {value}
                      </span>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          {tab ===
            'annotations' && (
            <section className="card">
              <p className="kicker">
                Biological metadata
              </p>

              <h2>
                Annotation Manager
              </h2>

              <form
                onSubmit={
                  addAnnotation
                }
              >
                <label>
                  Name
                  <input
                    name="name"
                    required
                    placeholder="e.g. lac promoter"
                  />
                </label>

                <label>
                  Type
                  <select name="type">
                    {[
                      'Promoter',
                      'Gene',
                      'CDS',
                      'Terminator',
                      'RBS',
                      'Origin',
                      'Miscellaneous'
                    ].map(type => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Start
                  <input
                    name="start"
                    type="number"
                    min="1"
                    defaultValue="1"
                    required
                  />
                </label>

                <label>
                  End
                  <input
                    name="end"
                    type="number"
                    min="1"
                    defaultValue={
                      Math.max(
                        1,
                        sequence.length
                      )
                    }
                    required
                  />
                </label>

                <label>
                  Strand
                  <select
                    name="strand"
                  >
                    <option value="+">
                      Forward (+)
                    </option>

                    <option value="-">
                      Reverse (-)
                    </option>
                  </select>
                </label>

                <label className="wide">
                  Notes
                  <input
                    name="notes"
                    placeholder="Optional description"
                  />
                </label>

                <button
                  className="primary"
                  type="submit"
                >
                  Add annotation
                </button>
              </form>

              <div className="annList">
                {annotations.length ? (
                  annotations.map(
                    annotation => (
                      <article
                        key={
                          annotation.id
                        }
                      >
                        <div>
                          <span className="chip">
                            {
                              annotation.type
                            }
                          </span>

                          <h3>
                            {
                              annotation.name
                            }
                          </h3>

                          <p>
                            Positions{' '}
                            {
                              annotation.start
                            }
                            –
                            {
                              annotation.end
                            }
                            {' · '}
                            Strand{' '}
                            {
                              annotation.strand
                            }
                          </p>

                          <small>
                            {
                              annotation.notes
                            }
                          </small>
                        </div>

                        <button
                          type="button"
                          className="delete"
                          onClick={() =>
                            setAnnotations(
                              previous =>
                                previous.filter(
                                  item =>
                                    item.id !==
                                    annotation.id
                                )
                            )
                          }
                        >
                          Delete
                        </button>
                      </article>
                    )
                  )
                ) : (
                  <p className="empty">
                    No annotations yet.
                  </p>
                )}
              </div>
            </section>
          )}

          {tab ===
            'visualisation' && (
            <section className="card">
              <p className="kicker">
                Interactive DNA viewer
              </p>

              <h2>
                SeqViz Visualisation
              </h2>

              {sequence ? (
                <div className="seqvizShell">
                  <SeqViz
                    name={project}
                    seq={sequence}
                    viewer="both"
                    showComplement={
                      true
                    }
                    annotations={annotations
                      .filter(
                        annotation =>
                          annotation.start >=
                            1 &&
                          annotation.end <=
                            sequence.length
                      )
                      .map(
                        (
                          annotation,
                          index
                        ) => ({
                          start:
                            annotation.start -
                            1,

                          end:
                            annotation.end,

                          name:
                            annotation.name,

                          direction:
                            annotation.strand ===
                            '-'
                              ? -1
                              : 1,

                          color: [
                            '#6d4c7d',
                            '#8a674f',
                            '#a68b32',
                            '#557565',
                            '#8c557b'
                          ][
                            index % 5
                          ]
                        })
                      )}
                    style={{
                      height:
                        '560px',
                      width:
                        '100%'
                    }}
                  />
                </div>
              ) : (
                <p className="empty">
                  Add or import a DNA
                  sequence to activate
                  SeqViz.
                </p>
              )}

              <p className="muted">
                SeqViz renders the
                active sequence in
                linear and circular
                views. Annotation
                coordinates are
                converted from the
                editor&apos;s 1-based
                positions to
                SeqViz&apos;s 0-based
                ranges.
              </p>
            </section>
          )}

          {tab ===
            'analysis' && (
            <section className="card">
              <p className="kicker">
                Real-time calculations
              </p>

              <h2>
                Sequence Analysis
              </h2>

              <div className="analysis">
                <article>
                  <span>
                    GC content
                  </span>

                  <strong>
                    {st.gc}%
                  </strong>

                  <div className="meter">
                    <i
                      style={{
                        width:
                          st.gc + '%'
                      }}
                    />
                  </div>
                </article>

                <article>
                  <span>
                    AT content
                  </span>

                  <strong>
                    {st.at}%
                  </strong>

                  <div className="meter">
                    <i
                      style={{
                        width:
                          st.at + '%'
                      }}
                    />
                  </div>
                </article>

                {Object.entries(
                  st.c
                ).map(
                  ([base, value]) => (
                    <article
                      key={base}
                    >
                      <span>
                        {base} count
                      </span>

                      <strong>
                        {value}
                      </strong>

                      <small>
                        {st.n
                          ? (
                              (value /
                                st.n) *
                              100
                            ).toFixed(
                              2
                            )
                          : '0.00'}
                        %
                      </small>
                    </article>
                  )
                )}
              </div>
            </section>
          )}

          {tab ===
            'sbol' && (
            <section className="card">
              <p className="kicker">
                Standards manager
              </p>

              <h2>
                SBOL3 Manager
              </h2>

              <div className="two">
                <div>
                  <p>
                    Current supported
                    project data is
                    mapped to Component,
                    Sequence and
                    SequenceFeature
                    representations.
                  </p>

                  <button
                    type="button"
                    className="primary"
                    onClick={
                      exportSBOL
                    }
                  >
                    Export SBOL3
                    JSON-LD
                  </button>
                </div>

                <pre>
                  {JSON.stringify(
                    {
                      component:
                        project,

                      sequenceLength:
                        st.n,

                      featureCount:
                        annotations.length,

                      encoding:
                        'IUPAC DNA',

                      format:
                        'SBOL3-oriented JSON-LD'
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </section>
          )}
        </main>
      </div>

      <footer>
        <span>
          SBOL3 Sequence Editor
        </span>

        <span>
          React · JavaScript ·
          HTML5 · CSS3
        </span>
      </footer>

      {tutorial && (
        <div className="modal">
          <section>
            <button
              type="button"
              className="close"
              aria-label="Close tutorial"
              onClick={() =>
                setTutorial(false)
              }
            >
              ×
            </button>

            <p className="kicker">
              Quick tutorial
            </p>

            <h2>
              Build your first DNA
              construct
            </h2>

            <ol>
              <li>
                Create a new project
                or load the example.
              </li>

              <li>
                Edit DNA using A, C,
                G, T or N.
              </li>

              <li>
                Add biological
                features.
              </li>

              <li>
                Review visualisation
                and analysis.
              </li>

              <li>
                Export FASTA,
                project JSON or
                SBOL3 JSON-LD.
              </li>
            </ol>

            <button
              type="button"
              className="primary"
              onClick={() =>
                setTutorial(false)
              }
            >
              Start editing
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

ReactDOM
  .createRoot(
    document.getElementById(
      'root'
    )
  )
  .render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
