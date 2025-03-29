import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const TextEditor = () => {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.querySelector('.ql-editor')) {
      new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'code'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
            ['blockquote', 'code-block'],
            ['clean'],
          ],
        },
      });
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4 border rounded">
      <div ref={editorRef} className="bg-white min-h-[300px]" />
    </div>
  );
};

export default TextEditor;
