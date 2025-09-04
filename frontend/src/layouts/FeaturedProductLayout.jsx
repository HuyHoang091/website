import React from "react";
import "../../assets/styles/layouts/FeaturedProduct.css";

export default function FeaturedProduct({children}) {
    return (
    <section id="new" className="featured-products">
        <div className="overlay"></div>
        <div className="featured-container">
            <div className="featured-header fade-up">
                <div className="tag">💎 CURATED BY AI</div>
                <h2 className="featured-title">EXCLUSIVE COLLECTION</h2>
                <p className="featured-subtitle">Được tuyển chọn bởi AI dựa trên xu hướng thời trang toàn cầu</p>
            </div>

            <div className="products-grid">
                {children}
            </div>
        </div>
    </section>
    );
};