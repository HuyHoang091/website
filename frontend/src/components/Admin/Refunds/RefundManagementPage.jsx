import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDate } from '../../../utils/shopFormatters';
import styles from './RefundManagement.module.css';

const RefundManagementPage = () => {
    const [activeTab, setActiveTab] = useState('failed');
    const [failedRefunds, setFailedRefunds] = useState([]);
    const [successRefunds, setSuccessRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadRefunds();
    }, []);

    const loadRefunds = async () => {
        setLoading(true);
        try {
            const [failedRes, successRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_API_URL}/api/refunds/failed`),
                axios.get(`${process.env.REACT_APP_API_URL}/api/refunds/success`)
            ]);
            setFailedRefunds(failedRes.data);
            setSuccessRefunds(successRes.data);
        } catch (err) {
            setError('Failed to load refund data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = async (orderId) => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/refunds/retry/${orderId}`);
            loadRefunds();
        } catch (err) {
            setError('Failed to retry refund');
            console.error(err);
        }
    };

    const handleDelete = async (type, orderId) => {
        if (!window.confirm(`Are you sure you want to delete this refund record?`)) {
            return;
        }
        
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/refunds/${type}/${orderId}`);
            loadRefunds();
        } catch (err) {
            setError('Failed to delete refund record');
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading refund data...</p>
            </div>
        );
    }

    return (
        <div className={styles.refundManagementPage}>
            <h2 className={styles.pageTitle}>Refund Management</h2>
            
            {error && (
                <div className={styles.alert}>
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className={styles.closeBtn}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            )}

            <div className={styles.tabContainer}>
                <div 
                    className={`${styles.tab} ${activeTab === 'failed' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('failed')}
                >
                    Failed Refunds <span className={styles.badge}>{failedRefunds.length}</span>
                </div>
                <div 
                    className={`${styles.tab} ${activeTab === 'success' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('success')}
                >
                    Successful Refunds <span className={styles.badge}>{successRefunds.length}</span>
                </div>
                <button 
                    className={styles.refreshButton}
                    onClick={loadRefunds}
                >
                    <i className="fas fa-sync-alt"></i> Refresh
                </button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'failed' && (
                    <>
                        {failedRefunds.length === 0 ? (
                            <div className={styles.noData}>
                                <i className="fas fa-check-circle"></i>
                                <p>No failed refunds</p>
                            </div>
                        ) : (
                            <div className={styles.refundTable}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Capture ID</th>
                                            <th>Reason</th>
                                            <th>Requested By</th>
                                            <th>Retry Count</th>
                                            <th>Created At</th>
                                            <th>Error</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {failedRefunds.map((item) => {
                                            const refund = item.refund;
                                            return (
                                                <tr key={refund.orderId}>
                                                    <td>{refund.orderId}</td>
                                                    <td>{refund.captureId}</td>
                                                    <td>{refund.reason}</td>
                                                    <td>{refund.requestedBy}</td>
                                                    <td>{refund.retryCount}</td>
                                                    <td>{formatDate(refund.createdAt)}</td>
                                                    <td className={styles.errorCell}>
                                                        <div className={styles.errorTooltip}>
                                                            {String(item.error).substring(0, 50)}...
                                                            <span className={styles.tooltipText}>
                                                                {String(item.error)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className={styles.actionButtons}>
                                                            <button 
                                                                className={styles.retryButton}
                                                                onClick={() => handleRetry(refund.orderId)}
                                                            >
                                                                <i className="fas fa-redo"></i>
                                                            </button>
                                                            <button 
                                                                className={styles.deleteButton}
                                                                onClick={() => handleDelete('failed', refund.orderId)}
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'success' && (
                    <>
                        {successRefunds.length === 0 ? (
                            <div className={styles.noData}>
                                <i className="fas fa-info-circle"></i>
                                <p>No successful refunds</p>
                            </div>
                        ) : (
                            <div className={styles.refundTable}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Capture ID</th>
                                            <th>Reason</th>
                                            <th>Requested By</th>
                                            <th>Refunded At</th>
                                            <th>PayPal ID</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {successRefunds.map((item) => {
                                            const refund = item.refund;
                                            const response = item.response;
                                            return (
                                                <tr key={refund.orderId}>
                                                    <td>{refund.orderId}</td>
                                                    <td>{refund.captureId}</td>
                                                    <td>{refund.reason}</td>
                                                    <td>{refund.requestedBy}</td>
                                                    <td>{formatDate(refund.createdAt)}</td>
                                                    <td>{response.id}</td>
                                                    <td>
                                                        <button 
                                                            className={styles.deleteButton}
                                                            onClick={() => handleDelete('success', refund.orderId)}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default RefundManagementPage;