import React, { Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Loading from "../components/Loading/Loading";
import Layout from "../layouts/Layout";
import LoginPage from "../pages/Auth/LoginPage";
import ClientSocket from "../utils/ClientSocket";
import ImageSearch from "../pages/ImageSearch";
import CustomerChatWindow from "../components/Chat/CustomerChatWindow";
// import ChatPage from "../pages/Chat/ChatPage";

const LandingPage = React.lazy(() =>
  new Promise((resolve) => {
    setTimeout(() => resolve(import("../pages/Landing/LandingPage")), 2000);
  })
);

const ChatPage = React.lazy(() =>
  new Promise((resolve) => {
    setTimeout(() => resolve(import("../pages/Chat/ChatPage")), 2000);
  })
);

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <Layout>
              <Suspense fallback={<Loading message="Đang tải trang chủ..." />}>
                <motion.div {...pageTransition}>
                  <LandingPage />
                </motion.div>
              </Suspense>
            </Layout>
          }
        />
        <Route
          path="/login"
          element={
            <Layout>
              <motion.div {...pageTransition}>
                <LoginPage />
              </motion.div>
            </Layout>
          }
        />

        {/* Các route không có Header */}
        <Route
          path="/chat"
          element={
            <motion.div {...pageTransition}>
              <ClientSocket />
            </motion.div>
          }
        />
        <Route
          path="/chatuser"
          element={
            <motion.div {...pageTransition}>
              <CustomerChatWindow />
            </motion.div>
          }
        />
        <Route
          path="/search"
          element={
            <Layout>
                <motion.div {...pageTransition}>
                    <ImageSearch />
                </motion.div>
            </Layout>
          }
        />
        <Route
          path="/test"
          element={
            <Suspense fallback={<Loading message="Đang tải cuộc trò chuyện..." />}>
                <motion.div {...pageTransition}>
                    <ChatPage />
                </motion.div>
            </Suspense>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
