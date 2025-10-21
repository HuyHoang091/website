import React from 'react';
import styles from './UserManagement.module.css';

const Pagination = ({ usersPerPage, totalUsers, paginate, currentPage }) => {
    const pageNumbers = [];

    // Tính tổng số trang
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    return (
        <nav className={styles.pagination}>
            <ul className={styles.paginationList}>
                {/* Nút "Trang trước" */}
                <li className={styles.paginationItem}>
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        className={styles.pageLink}
                        disabled={currentPage === 1} // Vô hiệu hóa nếu đang ở trang đầu tiên
                    >
                        &laquo; Trang trước
                    </button>
                </li>

                {/* Các số trang */}
                {pageNumbers.map((number) => (
                    <li
                        key={number}
                        className={`${styles.paginationItem} ${
                            currentPage === number ? styles.activePage : ''
                        }`}
                    >
                        <button onClick={() => paginate(number)} className={styles.pageLink}>
                            {number}
                        </button>
                    </li>
                ))}

                {/* Nút "Trang sau" */}
                <li className={styles.paginationItem}>
                    <button
                        onClick={() => paginate(currentPage + 1)}
                        className={styles.pageLink}
                        disabled={currentPage === totalPages} // Vô hiệu hóa nếu đang ở trang cuối cùng
                    >
                        Trang sau &raquo;
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default Pagination;