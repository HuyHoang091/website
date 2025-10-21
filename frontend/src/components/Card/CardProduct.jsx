import React from "react";

export default function CardProduct({icon, lable, lable1, nameProduct, describe, evaluate, numberReview, current, old, colors = []}) {
    function Evaluave() {
        let star = "";
        if (evaluate === 1) {
            star = "⭐";
        } else if (evaluate === 2) {
            star = "⭐⭐";
        } else if (evaluate === 3) {
            star = "⭐⭐⭐";
        } else if (evaluate === 4) {
            star = "⭐⭐⭐⭐";
        } else if (evaluate === 5) {
            star = "⭐⭐⭐⭐⭐";
        }

        return star;
    }

    function Colors(color, idx) {
        if (color === "red") {
            return <button className="color red" key={idx}></button>;
        } else if (color === "blue") {
            return <button className="color blue" key={idx}></button>;
        } else if (color === "black") {
            return <button className="color black" key={idx}></button>;
        }
        return null;
    }

    const isImage = typeof icon === 'string' && (icon.includes('.png') || icon.includes('.jpg') || icon.includes('.jpeg') || icon.includes('.gif') || icon.includes('.svg'));
    
    return (
        <div className="product-card group">
            <div className="product-image pink">
                <div className="emoji">
                    {isImage ? (
                        <img src={icon} alt={nameProduct} />
                    ) : (
                        icon
                    )}
                </div>
                <div className="image-overlay"></div>
                <div className="label luxury">{lable}</div>
                <div className="label ai-fit right">{lable1}</div>
                <button className="favorite-button">💖</button>
            </div>
            <div className="product-info-featured">
                <h3>{nameProduct}</h3>
                <p>{describe}</p>
                <div className="rating">
                    <div className="stars">{Evaluave()}</div>
                    <span>{numberReview}</span>
                </div>
                <div className="price">
                    <span className="current">{current}</span>
                    <span className="old">{old}</span>
                </div>
                <div className="colors">
                    {colors.map((color, idx) => 
                        Colors(color, idx)
                    )}
                </div>
                <div className="actions">
                    <button className="btn add-to-cart">ADD TO CART</button>
                    <button className="btn try-btn">👁️ TRY</button>
                </div>
            </div>
        </div>
    );
}