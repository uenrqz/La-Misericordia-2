import React from 'react';

const Spinner = () => {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-700"></div>
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

export default Spinner;
