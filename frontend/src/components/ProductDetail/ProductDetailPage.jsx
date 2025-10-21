import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Breadcrumb from './Breadcrumb';
import ImageGallery from './ImageGallery';
import ProductInfo from './ProductInfo';
import ReviewsSection from './ReviewsSection';
import { getProductBySlug, getReviewStatistics, getProductReviews } from './productService';
import './ProductDetail.css';

const ProductDetailPage = () => {
    const { slug } = useParams(); // Get slug from URL params
    const [product, setProduct] = useState(null);
    const [reviewStats, setReviewStats] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch product details
                const productData = await getProductBySlug(slug);
                setProduct(productData);

                // Fetch review statistics
                const statsData = await getReviewStatistics(slug);
                setReviewStats(statsData);

                // Fetch top 3 reviews
                const reviewsData = await getProductReviews(slug);
                setReviews(reviewsData);

                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        if (slug) {
            fetchData();
        }
    }, [slug]);

    if (loading) {
        return (
            <div className="product-detail-page">
                <div className="container">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Đang tải...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="product-detail-page">
                <div className="container">
                    <div className="error-message">
                        <p>Đã xảy ra lỗi: {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="product-detail-page">
                <div className="container">
                    <div className="error-message">
                        <p>Không tìm thấy sản phẩm</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="product">
            <div className="product-detail-page">
                <div className="container">
                    <Breadcrumb productName={product.name} />

                    <div className="product-grid">
                        <ImageGallery images={product.url} productName={product.name} />
                        
                        <ProductInfo 
                            product={product}
                            slug={slug}
                        />
                    </div>

                    <ReviewsSection 
                        slug={slug}
                        stats={reviewStats}
                        reviews={reviews}
                        totalReviews={product.number_review}
                        avgRating={reviewStats?.avgRating || 0}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;