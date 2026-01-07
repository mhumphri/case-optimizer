// components/LandingPage.tsx
import React from 'react';
import type { ScenarioType } from '../types/route';

interface LandingPageProps {
  onScenarioSelect: (scenario: ScenarioType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onScenarioSelect }) => {
  return (
    <div className="flex-1 overflow-y-auto flex justify-center bg-gray-50">
      <div className="w-full px-4 py-8 md:px-8 md:max-w-4xl my-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8 text-center">
          Choose Optimization Scenario
        </h1>

        {/* Responsive grid: 1 column on mobile, 2 columns on desktop */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 items-center md:items-stretch">
          {/* Full Scenario Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200 hover:border-blue-400 transition-colors w-full max-w-[500px] md:max-w-none">
            <h2 className="text-xl md:text-2xl font-bold text-blue-600 mb-4">📊 Full Scenario</h2>
            <ul className="space-y-2 mb-6 text-sm md:text-base text-gray-700">
              <li>✓ 200 cases across London</li>
              <li>✓ 6 agents (W6 9LI, W2 3EL, SE12 4WH, E10 1PI, SE14 5NP, SW15 7GB)</li>
              <li>✓ Default hours: 09:00-17:00</li>
              <li>✓ 45-minute lunch break</li>
              <li>✓ Priority-based optimization</li>
              <li>✓ ~1 in 12 cases with delivery slots</li>
              <li>✓ Agent 1 finishes at SW1A 1AA</li>
            </ul>
            <button
              onClick={() => onScenarioSelect('full')}
              className="w-full px-6 py-3 text-base font-bold text-white bg-blue-500 border-none rounded cursor-pointer hover:bg-blue-600 transition-colors"
            >
              🚀 Run Full Scenario
            </button>
          </div>

          {/* Reduced Scenario Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-200 hover:border-green-400 transition-colors w-full max-w-[500px] md:max-w-none">
            <h2 className="text-xl md:text-2xl font-bold text-green-600 mb-4">📉 Reduced Scenario</h2>
            <ul className="space-y-2 mb-6 text-sm md:text-base text-gray-700">
              <li>✓ 8 cases across London</li>
              <li>✓ 2 agents (W6 9LI, SE14 5NP)</li>
              <li>✓ Default hours: 10:30-14:00</li>
              <li>✓ 45-minute lunch break</li>
              <li>✓ Priority-based optimization</li>
              <li>✓ ~1 in 12 cases with delivery slots</li>
              <li>✓ Agent 1 finishes at EC1A 1BB</li>
            </ul>
            <button
              onClick={() => onScenarioSelect('reduced')}
              className="w-full px-6 py-3 text-base font-bold text-white bg-green-500 border-none rounded cursor-pointer hover:bg-green-600 transition-colors"
            >
              🚀 Run Reduced Scenario
            </button>
          </div>
        </div>

        <p className="text-center text-xs md:text-sm text-gray-600 mt-6">
          All scenarios use real London postcodes and Google Route Optimization API
        </p>
      </div>
    </div>
  );
};