"use client";

import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

type Props = {
  value: string;
  onChange: (html: string) => void;
  onCountUpdate?: (counts: { words: number; chars: number }) => void;
  disabled?: boolean;
  maxCharacters?: number;
};

const TextEditor: React.FC<Props> = ({
  value = "",
  onChange,
  onCountUpdate,
  disabled = false,
  maxCharacters,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true); // Ensure component is mounted on client only
  }, []);

  useEffect(() => {
    if (!isMounted || !editorRef.current || quillRef.current) return;

    quillRef.current = new Quill(editorRef.current, {
      theme: "snow",
      readOnly: disabled,
      modules: {
        toolbar: disabled ? false : [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["blockquote", "code-block"],
          ["clean"],
        ],
      },
    });

    quillRef.current.on("text-change", () => {
      if (quillRef.current) {
        const html = quillRef.current.root.innerHTML;
        const text = quillRef.current.getText();
        
        // ✅ Word and character count logic
        const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
        const charCount = text.length;

        // Check character limit
        if (maxCharacters && charCount > maxCharacters) {
          // Prevent the change by reverting to the previous content
          quillRef.current.history.undo();
          return;
        }

        onChange(html);
        onCountUpdate?.({ words: wordCount, chars: charCount });
      }
    });

    quillRef.current.root.innerHTML = value;
  }, [isMounted, onChange, onCountUpdate, value, disabled]);

  // Update read-only state when disabled prop changes
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!disabled);
    }
  }, [disabled]);

  useEffect(() => {
    if (
      isMounted &&
      quillRef.current &&
      value !== quillRef.current.root.innerHTML
    ) {
      quillRef.current.root.innerHTML = value;
    }
  }, [value, isMounted]);

  if (!isMounted) return null; // Prevent hydration mismatch

  return (
    <div className="h-full w-full min-h-[300px]">
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Sticky toolbar and dark theme adjustments */
          .ql-toolbar.ql-snow {
            position: sticky;
            top: 0; /* stick to very top of the scroll container */
            z-index: 30;
            background: #0E172B; /* fully opaque to prevent text showing through */
            -webkit-backdrop-filter: none;
            backdrop-filter: none;
            border: 1px solid rgba(255, 255, 255, 0.28);
            border-bottom: 1px solid rgba(255, 255, 255, 0.38); /* slightly brighter separation */
            border-top-left-radius: 0.75rem;
            border-top-right-radius: 0.75rem;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
          }

          .ql-container.ql-snow {
            border: 1px solid rgba(255, 255, 255, 0.38); /* white outline for editor */
            border-top: none;
            margin-top: 0; /* container sits right under toolbar */
            border-bottom-left-radius: 0.75rem;
            border-bottom-right-radius: 0.75rem;
          }

          .ql-container.ql-snow:focus-within {
            border-color: rgba(255, 255, 255, 0.65);
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
          }

          .ql-toolbar .ql-stroke {
            stroke: white !important;
          }
          .ql-toolbar .ql-fill {
            fill: white !important;
          }
          .ql-toolbar .ql-picker-label {
            color: white !important;
          }
          .ql-toolbar button:hover .ql-stroke {
            stroke: #60a5fa !important;
          }
          .ql-toolbar button:hover .ql-fill {
            fill: #60a5fa !important;
          }
          .ql-toolbar button {
            border-radius: 0.5rem;
            transition: background-color 0.15s ease, transform 0.15s ease;
          }
          .ql-toolbar button:hover {
            background: rgba(255, 255, 255, 0.06);
          }
          .ql-toolbar button:active {
            transform: scale(0.97);
          }
          .ql-toolbar button.ql-active .ql-stroke {
            stroke: #3b82f6 !important;
          }
          .ql-toolbar button.ql-active .ql-fill {
            fill: #3b82f6 !important;
          }
          .ql-editor {
            color: white !important;
            padding-top: 16px; /* ensure first lines never collide with toolbar */
          }
          .ql-editor p {
            color: white !important;
          }
          .ql-picker-options {
            background: white !important;
            border: 1px solid #d1d5db !important;
          }
          /* Ensure icons in dropdowns are visible on white background */
          .ql-picker-options .ql-stroke {
            stroke: #374151 !important; /* slate-700 */
          }
          .ql-picker-options .ql-fill {
            fill: #374151 !important; /* slate-700 */
          }
          .ql-picker-item {
            color: #374151 !important;
          }
          .ql-picker-item:hover {
            background: #f3f4f6 !important;
            color: #111827 !important;
          }
          .ql-picker-item:hover .ql-stroke {
            stroke: #111827 !important; /* slate-900 */
          }
          .ql-picker-item:hover .ql-fill {
            fill: #111827 !important; /* slate-900 */
          }
          .ql-picker-options * {
            color: #374151 !important;
          }
          .ql-picker-options *::before {
            color: #374151 !important;
          }
          .ql-picker-options *::after {
            color: #374151 !important;
          }
        `
      }} />
      <div ref={editorRef} className="h-full" />
    </div>
  );
};

export default TextEditor;
