import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = [];
  const maxPagesToShow = 5;
  
  // Determinar qué páginas mostrar
  let startPage, endPage;
  
  if (totalPages <= maxPagesToShow) {
    // Menos páginas que el máximo a mostrar, mostrar todas
    startPage = 1;
    endPage = totalPages;
  } else {
    // Más páginas que el máximo, determinar rango
    const maxPagesBeforeCurrentPage = Math.floor(maxPagesToShow / 2);
    const maxPagesAfterCurrentPage = Math.ceil(maxPagesToShow / 2) - 1;
    
    if (currentPage <= maxPagesBeforeCurrentPage) {
      // Cerca del inicio
      startPage = 1;
      endPage = maxPagesToShow;
    } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
      // Cerca del final
      startPage = totalPages - maxPagesToShow + 1;
      endPage = totalPages;
    } else {
      // En el medio
      startPage = currentPage - maxPagesBeforeCurrentPage;
      endPage = currentPage + maxPagesAfterCurrentPage;
    }
  }
  
  // Generar números de página
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  
  return (
    <div className="flex justify-center items-center mt-6">
      <nav className="inline-flex rounded-md shadow">
        <button
          onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-l-md focus:z-10 focus:outline-none ${
            currentPage === 1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          } border`}
        >
          <FaChevronLeft className="h-4 w-4" />
          <span className="sr-only">Anterior</span>
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-1 bg-white border text-gray-700 hover:bg-gray-50"
            >
              1
            </button>
            {startPage > 2 && (
              <span className="px-3 py-1 bg-white border text-gray-700">...</span>
            )}
          </>
        )}
        
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`px-3 py-1 border focus:z-10 focus:outline-none ${
              currentPage === number
                ? 'bg-blue-100 border-blue-500 text-blue-600' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {number}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-3 py-1 bg-white border text-gray-700">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-1 bg-white border text-gray-700 hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-r-md focus:z-10 focus:outline-none ${
            currentPage === totalPages 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          } border`}
        >
          <FaChevronRight className="h-4 w-4" />
          <span className="sr-only">Siguiente</span>
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
