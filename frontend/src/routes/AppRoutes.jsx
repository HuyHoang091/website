import React, { Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import LoginPage from "../pages/Auth/LoginPage";
import { AnimatePresence, motion } from "framer-motion";
import Loading from "../components/Loading/Loading";

const createLazyComponent = (importFunc, delay = 2000) => {
    return React.lazy(() => 
        new Promise(resolve => {
            setTimeout(() => {
                resolve(importFunc());
            }, delay);
        })
    );
};

const LandingPage = createLazyComponent(
    () => import("../pages/Landing/LandingPage"),
    2000
);

const AppRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={
                    <Suspense fallback={<Loading message="Đang tải trang chủ..." />}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}>
                            <LandingPage />
                        </motion.div>
                    </Suspense>
                } />
                <Route path="/login" element={
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}>
                        <LoginPage />
                    </motion.div>} />
            </Routes>
        </AnimatePresence>
    )
}

export default AppRoutes;