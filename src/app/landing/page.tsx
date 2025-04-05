"use client";

import TextEditor from "@/components/TextEditor";

const Landing = () => (
  <div className="bg-[var(--color-primary1)] p-4">
    <TextEditor
      value={""}
      onChange={(html: string) => {
        console.log(html); // Temporary implementation
      }}
    />
  </div>
);

export default Landing;
