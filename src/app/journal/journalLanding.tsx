"use client";

import TextEditor from "@/components/textEditor";

const JournalLanding = () => (
  <div className="bg-[var(--color-primary1)] p-4">
    <TextEditor
      value={""}
      onChange={(html: string) => {
        console.log(html); 
      }}
    />
  </div>
);

export default JournalLanding;
