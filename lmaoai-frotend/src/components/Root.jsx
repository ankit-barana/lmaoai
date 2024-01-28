import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";

function Root() {
  return (
    <div className="App">
      <NavBar />
      <main className="m-9 min-h-rmnav">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Root;
