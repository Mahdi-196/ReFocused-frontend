"use client";

import React from "react";

const PlannerPage = () => {
  return (
    <div className="min-h-screen p-6 bg-[var(--color-background)] text-[var(--color-primary1)]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Planner</h1>

        {/* Add planner sections below */}
        <section className="bg-white rounded-lg p-4 shadow mb-6">
          <h2 className="text-xl font-semibold mb-2">Today's Schedule</h2>
          {/* Placeholder */}
          <p className="text-gray-600">No tasks scheduled.</p>
        </section>

        <section className="bg-white rounded-lg p-4 shadow">
          <h2 className="text-xl font-semibold mb-2">Weekly Overview</h2>
          {/* Placeholder */}
          <p className="text-gray-600">Coming soon...</p>
        </section>
      </div>
    </div>
  );
};

export default PlannerPage;
