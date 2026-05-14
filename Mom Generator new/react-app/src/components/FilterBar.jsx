import React from "react";
import { Calendar } from "lucide-react";

const FilterBar = ({ filters, onFilterChange, onFetch, loading }) => {
  const handleSearchChange = (e) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleDateFromChange = (e) => {
    onFilterChange({ ...filters, dateFrom: e.target.value });
  };

  const handleDateToChange = (e) => {
    onFilterChange({ ...filters, dateTo: e.target.value });
  };

  return (
    <div className="border-b border-gray-200 bg-white p-4 space-y-3">
      <div className="flex gap-3 items-end flex-wrap">
        
        {/* Search */}
        <div className="flex-1 min-w-[250px]">
          <label className="text-sm font-medium block mb-2">
            Search
          </label>
          <input
            type="text"
            placeholder="Search by meeting title..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>

        {/* From Date */}
        <div className="w-48">
          <label className="text-sm font-medium block mb-2">
            From Date
          </label>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={handleDateFromChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>

        {/* To Date */}
        <div className="w-48">
          <label className="text-sm font-medium block mb-2">
            To Date
          </label>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="date"
              value={filters.dateTo}
              onChange={handleDateToChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={onFetch}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Search"}
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
