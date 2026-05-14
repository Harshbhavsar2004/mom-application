import React, { useState } from "react";
import { Plus } from "lucide-react";

const ParticipantManager = ({
  participants,
  onAddParticipant,
  onRemoveParticipant,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAddParticipant(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {/* Input */}
        <input
          type="text"
          placeholder="Enter participant name..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-3 py-2 border rounded-md text-sm"
        />

        {/* Add Button */}
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>
    </div>
  );
};

export default ParticipantManager;
