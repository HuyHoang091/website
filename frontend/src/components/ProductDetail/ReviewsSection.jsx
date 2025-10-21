import { useState } from 'react';
import RatingStars from './RatingStars';
import ReviewItem from './ReviewItem';
import { getAllReviews } from './productService';

const ReviewsSection = ({ slug, stats, reviews, totalReviews, avgRating }) => {
    const [allReviews, setAllReviews] = useState(null);
    const [showingAll, setShowingAll] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleViewAll = async () => {
        if (showingAll) {
            setShowingAll(false);
            return;
        }

        try {
            setLoading(true);
            const data = await getAllReviews(slug);
            setAllReviews(data);
            setShowingAll(true);
        } catch (err) {
            console.error('Error loading all reviews:', err);
            alert('Không thể tải đánh giá. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    const displayReviews = showingAll ? allReviews : reviews;

    const getRatingPercentage = (count) => {
        return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    };

    return (
        <div className="reviews-section">
            <h2 className="reviews-title font-playfair">Đánh giá từ khách hàng</h2>

            <div className="reviews-grid">
                {/* Rating Summary */}
                <div>
                    <div className="rating-summary">
                        <div className="rating-score">{avgRating.toFixed(1)}</div>
                        <div className="rating-stars">
                            <RatingStars rating={avgRating} />
                        </div>
                        <div className="rating-count">{totalReviews} đánh giá</div>
                    </div>

                    {stats && (
                        <div className="rating-breakdown">
                            <div className="rating-row">
                                <span className="rating-label">5★</span>
                                <div className="rating-bar">
                                    <div 
                                        className="rating-fill" 
                                        style={{ width: `${getRatingPercentage(stats.rating5)}%` }}
                                    />
                                </div>
                                <span className="rating-number">{stats.rating5}</span>
                            </div>
                            <div className="rating-row">
                                <span className="rating-label">4★</span>
                                <div className="rating-bar">
                                    <div 
                                        className="rating-fill" 
                                        style={{ width: `${getRatingPercentage(stats.rating4)}%` }}
                                    />
                                </div>
                                <span className="rating-number">{stats.rating4}</span>
                            </div>
                            <div className="rating-row">
                                <span className="rating-label">3★</span>
                                <div className="rating-bar">
                                    <div 
                                        className="rating-fill" 
                                        style={{ width: `${getRatingPercentage(stats.rating3)}%` }}
                                    />
                                </div>
                                <span className="rating-number">{stats.rating3}</span>
                            </div>
                            <div className="rating-row">
                                <span className="rating-label">2★</span>
                                <div className="rating-bar">
                                    <div 
                                        className="rating-fill" 
                                        style={{ width: `${getRatingPercentage(stats.rating2)}%` }}
                                    />
                                </div>
                                <span className="rating-number">{stats.rating2}</span>
                            </div>
                            <div className="rating-row">
                                <span className="rating-label">1★</span>
                                <div className="rating-bar">
                                    <div 
                                        className="rating-fill" 
                                        style={{ width: `${getRatingPercentage(stats.rating1)}%` }}
                                    />
                                </div>
                                <span className="rating-number">{stats.rating1}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Reviews List */}
                <div className="reviews-list">
                    {displayReviews && displayReviews.length > 0 ? (
                        <>
                            {displayReviews.map(review => (
                                <ReviewItem key={review.id} review={review} />
                            ))}

                            {totalReviews > 3 && (
                                <button 
                                    className="view-all-btn" 
                                    onClick={handleViewAll}
                                    disabled={loading}
                                >
                                    {loading 
                                        ? 'Đang tải...' 
                                        : showingAll 
                                            ? 'Thu gọn' 
                                            : `Xem tất cả ${totalReviews} đánh giá`
                                    }
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="no-reviews">
                            <p>Chưa có đánh giá nào cho sản phẩm này</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewsSection;