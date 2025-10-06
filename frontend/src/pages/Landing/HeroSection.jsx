import React from "react";
import "../../assets/styles/pages/Landding/HeroSection.css";

export default function HeroBanner() {
  return (
    <section class="hero-banner">
      <div class="hero-overlay"></div>
      <div class="hero-floating">
          <div class="floating blob1"></div>
          <div class="floating blob2"></div>
          <div class="floating blob3"></div>
      </div>

      <div class="hero-content">
          <div class="hero-grid">
              <div class="hero-left fade-up">
                  <div class="badge">
                      ✨ EXCLUSIVE COLLECTION 2024
                  </div>
                  <h1>
                      <span class="luxury-title">LUXURY</span>
                      <span class="luxury-subtitle">REDEFINED</span>
                  </h1>
                  <p class="hero-desc">
                      Trải nghiệm thời trang đỉnh cao với công nghệ AI tiên tiến.
                      <span class="highlight"> Độc quyền cho giới thượng lưu.</span>
                  </p>
                  <div class="hero-buttons">
                      <button class="btn-primary">🛍️ SHOP LUXURY</button>
                      <button class="btn-secondary">👑 VIP PREVIEW</button>
                  </div>
              </div>

              <div class="hero-right floating">
                  <div class="info-card">
                      <div class="card-badge">🤖 AI LUXURY CONCIERGE</div>
                      <h3 class="card-title">Personal Style AI</h3>
                      <div class="features">
                          <div class="feature">
                              <div class="icon">✨</div>
                              <div>
                                  <div class="feature-title">Phân tích phong cách cá nhân</div>
                                  <div class="feature-desc">Độ chính xác 99.8%</div>
                              </div>
                          </div>
                          <div class="feature">
                              <div class="icon">👗</div>
                              <div>
                                  <div class="feature-title">Thử đồ ảo 3D</div>
                                  <div class="feature-desc">Công nghệ AR tiên tiến</div>
                              </div>
                          </div>
                          <div class="feature">
                              <div class="icon">💎</div>
                              <div>
                                  <div class="feature-title">Tư vấn VIP 24/7</div>
                                  <div class="feature-desc">Stylist chuyên nghiệp</div>
                              </div>
                          </div>
                      </div>
                      <div class="card-footer">
                          <div class="stat">
                              <div class="stat-value">2,847</div>
                              <div class="stat-label">VIP Members Active</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </section>
  );
}