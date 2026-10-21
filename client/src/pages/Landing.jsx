import { useNavigate } from "react-router";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <>
      <title>Landing page</title>
      <h1>KitchSync</h1>
      <h2>Welcome to KitchSync</h2>
      <p>where you the best meals at affordable prices</p>

      <button className="cr" onClick={() => navigate("/register")}>Create Account</button>

      <p>Already have an account?</p>
      <button className="cr" onClick={() => navigate("/login")}>Login</button>
    </>
  );
}