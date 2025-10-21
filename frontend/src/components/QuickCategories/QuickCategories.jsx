import React from "react";
import "../../assets/styles/components/QuickCategories/QuickCategories.css"

const QuickCategories = () => {
  return (
    <section class="quick-categories">
        <div class="container-quick-categories">
            <div class="category-grid">
                <div class="category-card">
                    <div class="category-icon pink">👚</div>
                    <h3>Áo Sơ Mi</h3>
                    <p>250+ sản phẩm</p>
                </div>
                <div class="category-card">
                    <div class="category-icon blue">👗</div>
                    <h3>Váy Đầm</h3>
                    <p>180+ sản phẩm</p>
                </div>
                <div class="category-card">
                    <div class="category-icon green">👖</div>
                    <h3>Quần Jeans</h3>
                    <p>320+ sản phẩm</p>
                </div>
                <div class="category-card">
                    <div class="category-icon yellow">🧥</div>
                    <h3>Áo Khoác</h3>
                    <p>150+ sản phẩm</p>
                </div>
            </div>
        </div>
    </section>
  );
};

export default QuickCategories;