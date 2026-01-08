import React, { useState } from 'react';
import type { TimeSlot } from '../types/route';
import { generateTimeOptions } from '../utils/timeSlotGenerator';

interface TimeSlotInputProps {
  caseId: string;
  deliverySlot?: TimeSlot;
  onSlotChange: (caseId: string, slot: TimeSlot | undefined) => void;
}

export const TimeSlotInput: React.FC<TimeSlotInputProps> = ({
  caseId,
  deliverySlot,
  onSlotChange,
}) => {
  const [showInput, setShowInput] = useState(!!deliverySlot);
  // Local state to track display values when no actual deliverySlot exists yet
  const [localStartTime, setLocalStartTime] = useState('09:00');
  const [localEndTime, setLocalEndTime] = useState('17:00');
  const timeOptions = generateTimeOptions();

  // Check if a slot is the default (9am-5pm)
  const isDefaultSlot = (slot: TimeSlot | undefined): boolean => {
    return slot?.startTime === '09:00' && slot?.endTime === '17:00';
  };

  const handleAddSlot = () => {
    setShowInput(true);
    setLocalStartTime('09:00');
    setLocalEndTime('17:00');
    // Don't call onSlotChange yet - just show the UI with defaults
  };

  const handleRemoveSlot = () => {
    setShowInput(false);
    setLocalStartTime('09:00');
    setLocalEndTime('17:00');
    onSlotChange(caseId, undefined);
  };

  const handleStartTimeChange = (newStartTime: string) => {
    setLocalStartTime(newStartTime);
    const newSlot = {
      startTime: newStartTime,
      endTime: deliverySlot?.endTime || localEndTime,
    };
    
    // Only register as a change if different from default
    if (!isDefaultSlot(newSlot)) {
      onSlotChange(caseId, newSlot);
    } else {
      // If it's the default slot, treat as undefined (no specific constraint)
      onSlotChange(caseId, undefined);
    }
  };

  const handleEndTimeChange = (newEndTime: string) => {
    setLocalEndTime(newEndTime);
    const newSlot = {
      startTime: deliverySlot?.startTime || localStartTime,
      endTime: newEndTime,
    };
    
    // Only register as a change if different from default
    if (!isDefaultSlot(newSlot)) {
      onSlotChange(caseId, newSlot);
    } else {
      // If it's the default slot, treat as undefined (no specific constraint)
      onSlotChange(caseId, undefined);
    }
  };

  // Display values: use deliverySlot if it exists, otherwise use local state
  const displayStartTime = deliverySlot?.startTime || localStartTime;
  const displayEndTime = deliverySlot?.endTime || localEndTime;

  if (!showInput) {
    return (
      <div className="mb-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Time Slot
        </label>
        <button
          onClick={handleAddSlot}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
        >
          + Add Slot
        </button>
      </div>
    );
  }

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-medium text-gray-600">
          Time Slot
        </label>
<button
  onClick={handleRemoveSlot}
  className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 cursor-pointer"
>
  <span>Remove</span>
  <svg 
    width="12" 
    height="12" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
  </svg>
</button>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={displayStartTime}
          onChange={(e) => handleStartTimeChange(e.target.value)}
          className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer"
        >
          {timeOptions.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
        <div className="w-8 text-center text-xs text-gray-500">-</div>
        <select
          value={displayEndTime}
          onChange={(e) => handleEndTimeChange(e.target.value)}
          className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer"
        >
          {timeOptions.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};