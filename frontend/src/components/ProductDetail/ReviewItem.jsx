import RatingStars from './RatingStars';

const ReviewItem = ({ review }) => {
    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'U';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hôm nay';
        if (diffDays === 1) return '1 ngày trước';
        if (diffDays < 7) return `${diffDays} ngày trước`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
        return `${Math.floor(diffDays / 365)} năm trước`;
    };

    return (
        <div className="review-item">
            <div className="review-header">
                <div className="reviewer-avatar">
                    {getInitial(review.username)}
                </div>
                <div className="review-content">
                    <div className="reviewer-info">
                        <h4 className="reviewer-name">{review.username}</h4>
                        <span className="verified-badge">✓ Đã mua hàng</span>
                    </div>
                    <div className="review-meta">
                        <div className="review-stars">
                            <RatingStars rating={review.rating} size="small" />
                        </div>
                        <span className="review-date">{formatDate(review.createdAt)}</span>
                    </div>
                    <p className="review-text">{review.comment}</p>
                </div>
            </div>
        </div>
    );
};

export default ReviewItem;