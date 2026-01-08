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
  const timeOptions = generateTimeOptions();

  const handleAddSlot = () => {
    setShowInput(true);
    // Set default slot to 9am-5pm
    onSlotChange(caseId, {
      startTime: '09:00',
      endTime: '17:00',
    });
  };

  const handleRemoveSlot = () => {
    setShowInput(false);
    onSlotChange(caseId, undefined);
  };

  const handleStartTimeChange = (newStartTime: string) => {
    if (deliverySlot) {
      // Prevent start time from being >= end time
      if (newStartTime >= deliverySlot.endTime) {
        return;
      }
      onSlotChange(caseId, {
        ...deliverySlot,
        startTime: newStartTime,
      });
    }
  };

  const handleEndTimeChange = (newEndTime: string) => {
    if (deliverySlot) {
      // Prevent end time from being <= start time
      if (newEndTime <= deliverySlot.startTime) {
        return;
      }
      onSlotChange(caseId, {
        ...deliverySlot,
        endTime: newEndTime,
      });
    }
  };

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
          value={deliverySlot?.startTime}
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
          value={deliverySlot?.endTime}
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