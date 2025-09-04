import React from "react";
import HeroSection from "./HeroSection";
import QuickCategories from "../../components/QuickCategories/QuickCategories";
import FeaturedProduct from "../../layouts/FeaturedProductLayout";
import CardProduct from "../../components/Card/CardProduct";
import AiFeaturesBanner from "./AiFeaturesBanner";
import SaleLayout from "../../layouts/SaleLayout";
import SaleProduct from "../../components/Card/SaleProduct";
import Footer from "../../components/Footer/Footer"
import IconAI from "../../components/Button/IconAI";

const LandingPage = () => {
  const cards = [
    {
      icon: "/clothes/dress1.png", 
      lable: "💎 LUXURY", 
      lable1: "🤖 AI FIT", 
      nameProduct: "Silk Blouse Premium", 
      describe: "100% Mulberry Silk Handcrafted in Italy", 
      evaluate: 5, 
      numberReview: "243 reviews", 
      current: "2.890K", 
      old: "4.320K", 
      colors: ["red", "blue", "black"]
    },
    {
      icon: "👚", 
      lable: "💎 LUXURY", 
      lable1: "🤖 AI FIT", 
      nameProduct: "Silk Blouse Premium", 
      describe: "100% Mulberry Silk Handcrafted in Italy", 
      evaluate: 5, 
      numberReview: "243 reviews", 
      current: "2.890K", 
      old: "4.320K", 
      colors: ["red", "blue", "black"]
    },
    {
      icon: "👚", 
      lable: "💎 LUXURY", 
      lable1: "🤖 AI FIT", 
      nameProduct: "Silk Blouse Premium", 
      describe: "100% Mulberry Silk Handcrafted in Italy", 
      evaluate: 5, 
      numberReview: "243 reviews", 
      current: "2.890K", 
      old: "4.320K", 
      colors: ["red", "blue", "black"]
    },
    {
      icon: "👚", 
      lable: "💎 LUXURY", 
      lable1: "🤖 AI FIT", 
      nameProduct: "Silk Blouse Premium", 
      describe: "100% Mulberry Silk Handcrafted in Italy", 
      evaluate: 5, 
      numberReview: "243 reviews", 
      current: "2.890K", 
      old: "4.320K", 
      colors: ["red", "blue", "black"]
    }
  ];

  const saleCards = [
    {
      icon: "/clothes/dress1.png",
      nameProduct: "Áo thun Basic",
      current: "199K",
      old: "499K"
    },
    {
      icon: "/clothes/dress1.png",
      nameProduct: "Áo thun Basic",
      current: "199K",
      old: "499K"
    },
    {
      icon: "/clothes/dress1.png",
      nameProduct: "Áo thun Basic",
      current: "199K",
      old: "499K"
    },
    {
      icon: "/clothes/dress1.png",
      nameProduct: "Áo thun Basic",
      current: "199K",
      old: "499K"
    }
  ]

  return (
    <>
      <HeroSection />
      <QuickCategories />
      <FeaturedProduct>
        {cards.map((card, index) => (
          <CardProduct 
            key={index}
            icon={card.icon}
            lable={card.lable}
            lable1={card.lable1}
            nameProduct={card.nameProduct}
            describe={card.describe}
            evaluate={card.evaluate}
            numberReview={card.numberReview}
            current={card.current}
            old={card.old}
            colors={card.colors}
          />
        ))}
      </FeaturedProduct>
      <AiFeaturesBanner />
      <SaleLayout endTime="2025-08-20T23:59:59+07:00">
        {saleCards.map((item, idx) => (
          <SaleProduct items={item} key={idx} />
        ))}
      </SaleLayout>
      <IconAI />
      <Footer />
    </>
  );
};

export default LandingPage;