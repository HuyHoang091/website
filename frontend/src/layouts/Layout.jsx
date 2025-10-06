import React from "react";
import Header from "../components/Header/Header1";

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
