"use client";

import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

type Props = {
  value: string;
  onChange: (html: string) => void;
  onCountUpdate?: (counts: { words: number; chars: number }) => void;
};

const TextEditor: React.FC<Props> = ({
  value = "",
  onChange,
  onCountUpdate,
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
      modules: {
        toolbar: [
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
        const text = quillRef.current.getText().trim();
        onChange(html);

        // ✅ Word and character count logic
        const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
        const charCount = text.replace(/\s/g, "").length;

        onCountUpdate?.({ words: wordCount, chars: charCount });
      }
    });

    quillRef.current.root.innerHTML = value;
  }, [isMounted]);

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
    <div className="h-full w-full overflow-y-auto max-h-[calc(100vh-16rem)] min-h-[300px]">
      <div ref={editorRef} className="h-full" />
    </div>
  );
};

export default TextEditor;
