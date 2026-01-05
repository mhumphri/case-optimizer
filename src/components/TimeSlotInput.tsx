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
    console.log("handleStartTimeChange")
    if (deliverySlot) {
      onSlotChange(caseId, {
        ...deliverySlot,
        startTime: newStartTime,
      });
    }
  };

  const handleEndTimeChange = (newEndTime: string) => {
    console.log("handleEndTimeChange")
    if (deliverySlot) {
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
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
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
          className="text-xs text-red-600 hover:text-red-700 font-medium"
        >
          ✕ Remove
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
        <span className="text-xs text-gray-500">-</span>
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