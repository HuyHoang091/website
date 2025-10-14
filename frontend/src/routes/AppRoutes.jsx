import React, { Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Loading from "../components/Loading/Loading";
import Layout from "../layouts/Layout";
import LoginPage from "../pages/Auth/LoginPage";
import ClientSocket from "../utils/ClientSocket";
import ImageSearch from "../pages/ImageSearch";
import CustomerChatWindow from "../components/Chat/CustomerChatWindow";
import {ROUTE_PATHS} from "../utils/appConst";
import {ShopPage} from "../pages/Shop/ShopPage";
import ShoppingCart from "../components/ShoppingCart/ShoppingCart";
import CheckoutPage from "../components/Order/CheckoutPage";
import ShippingAddressPage from "../components/Address/ShippingAddressPage";
import PayPalPaymentPage from "../components/Payment/PayPalPaymentPage";
import {Dashboard} from "../pages/Dashboard/Dashboard";


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

const appRoutes = [
	{
		path: ROUTE_PATHS.HOME,
		element: <LandingPage />,
	},
	{
		path: ROUTE_PATHS.LOGIN,
		element: <LoginPage />,
	},
	{
		path: ROUTE_PATHS.SHOP,
		element: <ShopPage />,
	},
	{
		path: ROUTE_PATHS.DASHBOARD,
		element: <Dashboard />,
	},
];

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
	      {appRoutes?.map((route, index) => (
		      <Route
			      path={route.path}
			      element={
				      <Layout>
					      <Suspense fallback={<Loading message="Đang tải..." />}>
						      <motion.div {...pageTransition}>{route.element}</motion.div>
					      </Suspense>
				      </Layout>
			      }
		      />
	      ))}
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
          path="/payment"
          element={
            <motion.div {...pageTransition}>
              <PayPalPaymentPage />
            </motion.div>
          }
        />

        <Route
          path="/address"
          element={
            <motion.div {...pageTransition}>
              <ShippingAddressPage />
            </motion.div>
          }
        />

        <Route
          path="/order"
          element={
            <motion.div {...pageTransition}>
              <CheckoutPage />
            </motion.div>
          }
        />

        <Route
          path="/cart"
          element={
            <motion.div {...pageTransition}>
              <ShoppingCart />
            </motion.div>
          }
        />

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
