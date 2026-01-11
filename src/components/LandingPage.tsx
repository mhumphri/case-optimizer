// components/LandingPage.tsx
import React from 'react';
import type { ScenarioType } from '../types/route';

interface LandingPageProps {
  onScenarioSelect: (scenario: ScenarioType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onScenarioSelect }) => {
  return (
    <div className="flex-1 overflow-y-auto flex justify-center bg-gray-50">
      <div className="w-full px-4 py-8 md:px-8 md:max-w-2xl my-auto">
        {/* Single Test Scenario Card - centered */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200 hover:border-gray-300 transition-colors w-full max-w-[500px] mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Test Scenario</h2>
          <ul className="space-y-2 mb-6 text-sm md:text-base text-gray-700">
            <li>✓ 8 cases across London</li>
            <li>✓ 3 agents (W1A 1AA, SE14 5NP, SW1P 4DR)</li>
            <li>✓ Default hours: 10:30-14:00</li>
            <li>✓ 45-minute lunch break</li>
            <li>✓ Priority-based optimization</li>
            <li>✓ ~1 in 12 cases with delivery slots</li>
            <li>✓ Agent 1 finishes at EC1A 1BB</li>
          </ul>
          <button
            onClick={() => onScenarioSelect('reduced')}
            className="w-full px-6 py-3 text-base font-bold text-white bg-blue-500 border-none rounded cursor-pointer hover:bg-blue-600 transition-colors"
          >
            Run Test Optimization
          </button>
        </div>

        <p className="text-center text-xs md:text-sm text-gray-600 mt-6">
          All scenarios use real London postcodes and Google Route Optimization API
        </p>
      </div>
    </div>
  );
};