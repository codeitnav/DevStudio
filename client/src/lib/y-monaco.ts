import * as Y from 'yjs';
import type * as monaco from 'monaco-editor';
import * as error from 'lib0/error';
import { createMutex, mutex } from 'lib0/mutex';
import { Awareness } from 'y-protocols/awareness';

let monacoInstance: typeof monaco;
export const _SET_MONACO = (val: typeof monaco): void => {
  monacoInstance = val;
};

class RelativeSelection {
  public start: Y.RelativePosition;
  public end: Y.RelativePosition;
  public direction: monaco.SelectionDirection;

  constructor(
    start: Y.RelativePosition,
    end: Y.RelativePosition,
    direction: monaco.SelectionDirection,
  ) {
    this.start = start;
    this.end = end;
    this.direction = direction;
  }
}

const createRelativeSelection = (
  editor: monaco.editor.IStandaloneCodeEditor,
  monacoModel: monaco.editor.ITextModel,
  type: Y.Text,
): RelativeSelection | null => {
  const sel = editor.getSelection();
  if (sel !== null) {
    const startPos = sel.getStartPosition();
    const endPos = sel.getEndPosition();
    const start = Y.createRelativePositionFromTypeIndex(
      type,
      monacoModel.getOffsetAt(startPos),
    );
    const end = Y.createRelativePositionFromTypeIndex(
      type,
      monacoModel.getOffsetAt(endPos),
    );
    return new RelativeSelection(start, end, sel.getDirection());
  }
  return null;
};

const createMonacoSelectionFromRelativeSelection = (
  editor: monaco.editor.ICodeEditor,
  type: Y.Text,
  relSel: RelativeSelection,
  doc: Y.Doc,
): monaco.Selection | null => {
  const start = Y.createAbsolutePositionFromRelativePosition(relSel.start, doc);
  const end = Y.createAbsolutePositionFromRelativePosition(relSel.end, doc);

  if (start?.type === type && end?.type === type) {
    const model = editor.getModel() as monaco.editor.ITextModel;
    const startPos = model.getPositionAt(start.index);
    const endPos = model.getPositionAt(end.index);
    return monacoInstance.Selection.createWithDirection(
      startPos.lineNumber,
      startPos.column,
      endPos.lineNumber,
      endPos.column,
      relSel.direction,
    );
  }
  return null;
};

interface AwarenessState {
  selection?: {
    anchor: Y.RelativePosition;
    head: Y.RelativePosition;
  };
  user?: {
    name: string;
    color: string;
  };
}

export class MonacoBinding {
  public doc: Y.Doc;
  public ytext: Y.Text;
  public monacoModel: monaco.editor.ITextModel;
  public editors: Set<monaco.editor.IStandaloneCodeEditor>;
  public awareness: Awareness | null;
  private _mux: mutex;
  private _savedSelections: Map<
    monaco.editor.IStandaloneCodeEditor,
    RelativeSelection
  >;
  private _decorations: Map<monaco.editor.IStandaloneCodeEditor, string[]>;
  private _monacoChangeHandler: monaco.IDisposable;

  constructor(
    ytext: Y.Text,
    monacoModel: monaco.editor.ITextModel,
    editors: Set<monaco.editor.IStandaloneCodeEditor> = new Set(),
    awareness: Awareness | null = null,
  ) {
    this.doc = ytext.doc as Y.Doc;
    this.ytext = ytext;
    this.monacoModel = monacoModel;
    this.editors = editors;
    this.awareness = awareness;
    this._mux = createMutex();
    this._savedSelections = new Map();
    this._decorations = new Map();

    this.doc.on('beforeAllTransactions', this._beforeTransaction);
    ytext.observe(this._ytextObserver);
    monacoModel.setValue(ytext.toString());

    this._monacoChangeHandler = monacoModel.onDidChangeContent((event) => {
      this._mux(() => {
        this.doc.transact(() => {
          event.changes
            .slice() 
            .sort(
              (change1, change2) => change2.rangeOffset - change1.rangeOffset,
            )
            .forEach((change) => {
              ytext.delete(change.rangeOffset, change.rangeLength);
              ytext.insert(change.rangeOffset, change.text);
            });
        }, this);
      });
    });

    monacoModel.onWillDispose(() => {
      this.destroy();
    });

    if (this.awareness) {
      editors.forEach((editor) => {
        editor.onDidChangeCursorSelection(() => {
          if (editor.getModel() === monacoModel) {
            const sel = editor.getSelection();
            if (sel === null) {
              return;
            }
            let anchor = monacoModel.getOffsetAt(sel.getStartPosition());
            let head = monacoModel.getOffsetAt(sel.getEndPosition());
            if (sel.getDirection() === monacoInstance.SelectionDirection.RTL) {
              [anchor, head] = [head, anchor]; 
            }
            this.awareness?.setLocalStateField('selection', {
              anchor: Y.createRelativePositionFromTypeIndex(ytext, anchor),
              head: Y.createRelativePositionFromTypeIndex(ytext, head),
            });
          }
        });
        this.awareness?.on('change', this._rerenderDecorations);
      });
    }
  }

  private _beforeTransaction = (): void => {
    this._mux(() => {
      this._savedSelections = new Map();
      this.editors.forEach((editor) => {
        if (editor.getModel() === this.monacoModel) {
          const rsel = createRelativeSelection(
            editor,
            this.monacoModel,
            this.ytext,
          );
          if (rsel !== null) {
            this._savedSelections.set(editor, rsel);
          }
        }
      });
    });
  };

  private _ytextObserver = (event: Y.YTextEvent): void => {
    this._mux(() => {
      let index = 0;
      event.delta.forEach((op) => {
        if (op.retain !== undefined) {
          index += op.retain;
        } else if (op.insert !== undefined) {
            if (typeof op.insert === 'string') {
                const pos = this.monacoModel.getPositionAt(index);
                const range = new monacoInstance.Selection(
                    pos.lineNumber, pos.column, pos.lineNumber, pos.column
                );
                this.monacoModel.pushEditOperations([], [{ range, text: op.insert }], () => null);
                index += op.insert.length;
            } else {
                const pos = this.monacoModel.getPositionAt(index);
                const range = new monacoInstance.Selection(
                    pos.lineNumber, pos.column, pos.lineNumber, pos.column
                );
                this.monacoModel.pushEditOperations([], [{ range, text: '' }], () => null); 
                index += 1;
            }
        } else if (op.delete !== undefined) {
          const pos = this.monacoModel.getPositionAt(index);
          const endPos = this.monacoModel.getPositionAt(index + op.delete);
          const range = new monacoInstance.Selection(
            pos.lineNumber,
            pos.column,
            endPos.lineNumber,
            endPos.column,
          );
          this.monacoModel.pushEditOperations([], [{ range, text: '' }], () => null);
        } else {
          throw error.unexpectedCase();
        }
      });

      this.monacoModel.pushStackElement();

      this._savedSelections.forEach((rsel, editor) => {
        const sel = createMonacoSelectionFromRelativeSelection(
          editor,
          this.ytext,
          rsel,
          this.doc,
        );
        if (sel !== null) {
          editor.setSelection(sel);
        }
      });
    });
    this._rerenderDecorations();
  };

  private _rerenderDecorations = (): void => {
    this.editors.forEach((editor) => {
      if (this.awareness && editor.getModel() === this.monacoModel) {
        const currentDecorations = this._decorations.get(editor) || [];
        const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];

        this.awareness.getStates().forEach((state: AwarenessState, clientID) => {
          if (
            clientID !== this.doc.clientID &&
            state.selection?.anchor &&
            state.selection?.head
          ) {
            const anchorAbs = Y.createAbsolutePositionFromRelativePosition(
              state.selection.anchor,
              this.doc,
            );
            const headAbs = Y.createAbsolutePositionFromRelativePosition(
              state.selection.head,
              this.doc,
            );

            if (
              anchorAbs?.type === this.ytext &&
              headAbs?.type === this.ytext
            ) {
              let start, end, afterContentClassName, beforeContentClassName;
              if (anchorAbs.index < headAbs.index) {
                start = this.monacoModel.getPositionAt(anchorAbs.index);
                end = this.monacoModel.getPositionAt(headAbs.index);
                afterContentClassName = 'yRemoteSelectionHead';
                beforeContentClassName = null;
              } else {
                start = this.monacoModel.getPositionAt(headAbs.index);
                end = this.monacoModel.getPositionAt(anchorAbs.index);
                afterContentClassName = null;
                beforeContentClassName = 'yRemoteSelectionHead';
              }
              newDecorations.push({
                range: new monacoInstance.Range(
                  start.lineNumber,
                  start.column,
                  end.lineNumber,
                  end.column,
                ),
                options: {
                  className: 'yRemoteSelection',
                  afterContentClassName,
                  beforeContentClassName,
                },
              });
            }
          }
        });

        this._decorations.set(
          editor,
          editor.deltaDecorations(currentDecorations, newDecorations),
        );
      } else {
        this._decorations.delete(editor);
      }
    });
  };

  public destroy(): void {
    this._monacoChangeHandler.dispose();
    this.ytext.unobserve(this._ytextObserver);
    this.doc.off('beforeAllTransactions', this._beforeTransaction);
    this.awareness?.off('change', this._rerenderDecorations);
  }
}