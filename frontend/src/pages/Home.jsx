import { Navigate } from "react-router-dom";

function Home() {
  return <Navigate to="/login" replace />;
}

export default Home;