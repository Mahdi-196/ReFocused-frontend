import React from 'react';
import {Editor, EditorState} from 'draft-js';

function DraftEditor() {
  const [editorState, setEditorState] = React.useState(() => EditorState.createEmpty());

  return <Editor editorState={editorState} onChange={setEditorState} />;
}

export default DraftEditor;

