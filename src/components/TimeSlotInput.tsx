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
        <div className="text-[11px] text-gray-600 mb-1">Delivery Slot</div>
        <button
          onClick={handleAddSlot}
          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded cursor-pointer hover:bg-blue-100"
        >
          + Add Slot
        </button>
      </div>
    );
  }

  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1">
        <div className="text-[11px] text-gray-600">Delivery Slot</div>
        <button
          onClick={handleRemoveSlot}
          className="text-[10px] text-red-600 hover:text-red-700 cursor-pointer border-none bg-transparent p-0"
          title="Remove delivery slot"
        >
          ✕ Remove
        </button>
      </div>
      <div className="flex gap-2 items-center">
        <select
          value={deliverySlot?.startTime || '09:00'}
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
          value={deliverySlot?.endTime || '17:00'}
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