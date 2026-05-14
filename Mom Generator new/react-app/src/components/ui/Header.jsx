import React from 'react';

export const Header = ({ title, subtitle, action }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};
