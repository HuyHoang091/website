import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="pagination">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>‹ Trước</button>
            {/* page numbers as before */}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Sau ›</button>
        </div>
    );
};

export default Pagination;