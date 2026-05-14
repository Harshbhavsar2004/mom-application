import React from "react";
import { Download } from "lucide-react";

const MinutesGenerator = ({ minutes, onExport }) => {
  if (!minutes) return null;

  return (
    <div className="bg-white border rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Generated Meeting Minutes
        </h2>

        <button
          onClick={onExport}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export as Excel
        </button>
      </div>

      <div className="space-y-6">
        {/* Summary */}
        {minutes.summary && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {minutes.summary}
            </p>
          </div>
        )}

        {/* Detailed Entries */}
        {minutes.entries && minutes.entries.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Meeting Breakdown
            </h3>

            <div className="space-y-4">
              {minutes.entries.map((entry, index) => (
                <div
                  key={index}
                  className="border-l-4 border-blue-400 pl-4 py-2 bg-gray-50 rounded p-3"
                >
                  {entry.time && (
                    <p className="text-sm text-blue-600 font-semibold">
                      {entry.time}
                    </p>
                  )}

                  {entry.speaker && (
                    <p className="text-sm font-semibold">
                      Speaker: {entry.speaker}
                    </p>
                  )}

                  {entry.topic && (
                    <p className="text-sm text-gray-600 mt-1">
                      {entry.topic}
                    </p>
                  )}

                  {/* Action Items per entry */}
                  {entry.actionItems &&
                    entry.actionItems.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold">
                          Action Items:
                        </p>
                        <ul className="text-xs text-gray-600 mt-1 space-y-1">
                          {entry.actionItems.map((item, i) => (
                            <li key={i}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Decisions per entry */}
                  {entry.decisions &&
                    entry.decisions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold">
                          Decisions:
                        </p>
                        <ul className="text-xs text-gray-600 mt-1 space-y-1">
                          {entry.decisions.map((decision, i) => (
                            <li key={i}>✓ {decision}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Points */}
        {minutes.keyPoints && minutes.keyPoints.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Key Points
            </h3>
            <ul className="space-y-2">
              {minutes.keyPoints.map((point, index) => (
                <li
                  key={index}
                  className="flex gap-2 text-sm text-gray-600"
                >
                  <span className="font-bold">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Decisions */}
        {minutes.decisions && minutes.decisions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Decisions Made
            </h3>
            <ul className="space-y-2">
              {minutes.decisions.map((decision, index) => (
                <li
                  key={index}
                  className="flex gap-2 text-sm text-gray-600"
                >
                  <span className="text-green-600 font-bold">✓</span>
                  {decision}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {minutes.actionItems && minutes.actionItems.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Action Items
            </h3>
            <ul className="space-y-2">
              {minutes.actionItems.map((item, index) => (
                <li
                  key={index}
                  className="flex gap-2 text-sm text-gray-600"
                >
                  <input type="checkbox" disabled />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinutesGenerator;
