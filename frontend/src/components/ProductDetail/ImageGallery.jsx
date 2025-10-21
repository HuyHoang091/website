import { useState } from 'react';

const HeartIcon = ({ filled }) => (
    <svg fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);

const ImageGallery = ({ images, productName }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isWishlisted, setIsWishlisted] = useState(false);

    const selectImage = (index) => {
        setCurrentImageIndex(index);
    };

    const toggleWishlist = () => {
        setIsWishlisted(!isWishlisted);
        // TODO: Call API to add/remove from wishlist
    };

    return (
        <div className="image-gallery">
            <div className="main-image">
                <img 
                    src={images[currentImageIndex]} 
                    alt={`${productName} - View ${currentImageIndex + 1}`}
                />
                <button 
                    className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
                    onClick={toggleWishlist}
                >
                    <HeartIcon filled={isWishlisted} />
                </button>
            </div>

            {images.length > 1 && (
                <div className="thumbnail-list">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                            onClick={() => selectImage(index)}
                        >
                            <img src={image} alt={`${productName} thumbnail ${index + 1}`} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageGallery;