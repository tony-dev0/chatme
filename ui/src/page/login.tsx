// import "bootstrap/dist/css/bootstrap.min.css";
import { useContext, useRef } from "react";
import logo from "../assets/logo128.png";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  const { isFetching, dispatch } = useContext(AuthContext);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.current?.value || !password.current?.value) {
      toast.error("All fields must be provided");
      return;
    }
    const userCredential = {
      email: email.current.value,
      password: password.current.value,
    };
    dispatch({ type: "LOGIN_START" });
    try {
      const res = await axios.post("/auth/login", userCredential);
      dispatch({ type: "LOGIN_SUCCESS", payload: res.data });
      navigate("/");
    } catch (err) {
      dispatch({ type: "LOGIN_FAILURE", payload: err });
      toast.error("incorrect credential");
    }
  };

  return (
    <div className="wrapper">
      <div className="mcontent d-lg-none d-block w-100">
        <div className="d-flex justify-content-center align-items-center">
          <img src={logo} alt="" width={48} height={40} />
          <h2 className="text-primary fw-bold mt-2"> Chat.me</h2>
        </div>
      </div>
      <div className="p6 d-flex justify-content-center align-items-center gap-5">
        <div className="mcontent d-lg-block d-none">
          <h1 className="text-primary fw-bold">Chat.me</h1>
          <p className="fw-medium fs-4 text-dark opacity-85">
            Chat.me helps you connect and share with the people in your life.
          </p>
        </div>
        <div className="form">
          <form onSubmit={handleSubmit}>
            <div className="form-gp mb-4">
              <input
                type="email"
                className="form-control"
                name="username"
                placeholder="Email address"
                ref={email}
              />
              <input
                type="password"
                className="form-control"
                name="password"
                placeholder="Password"
                ref={password}
              />
            </div>
            <button
              className="btn btn-primary w-100 fw-bold fs-5"
              disabled={isFetching}
            >
              {isFetching ? "Logging in..." : "Log in"}
            </button>
            <p className="text-center text-primary my-4 small">
              Forgotten password?
            </p>
            <hr />
            <p className="text-center pb-2">
              <Link to="/register">
                <button className="btn btn-success w-75 fw-bold fs-5">
                  Create new account
                </button>
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
