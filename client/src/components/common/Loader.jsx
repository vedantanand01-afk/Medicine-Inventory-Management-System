import React from 'react';

const Loader = ({ message = 'Loading data...', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin"></div>
            <div className="absolute w-6 h-6 rounded-full bg-emerald-500/20 animate-pulse"></div>
          </div>
          <p className="text-sm font-medium text-slate-700">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 w-full">
      <div className="w-10 h-10 rounded-full border-3 border-emerald-100 border-t-emerald-600 animate-spin"></div>
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
};

export default Loader;
