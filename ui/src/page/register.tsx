import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo128.png";
import { useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
// import "bootstrap/dist/css/bootstrap.min.css";

const Register: React.FC = () => {
  const username = useRef<HTMLInputElement>(null);
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  const passwordConfirm = useRef<HTMLInputElement>(null);
  const gender = useRef<HTMLSelectElement>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordConfirm.current?.value !== password.current?.value) {
      toast.error("Passwords don't match!");
      // passwordConfirm.current?.setCustomValidity("Passwords don't match!");
      return;
    }
    if (
      !email.current?.value ||
      !password.current?.value ||
      !username.current?.value ||
      !gender.current?.value
    ) {
      toast.error("All fields must be provided");
      return;
    }
    const user = {
      username: username.current.value,
      email: email.current.value,
      password: password.current.value,
      gender: gender.current.value,
    };
    try {
      await axios.post("/auth/register", user);
      navigate("/login");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong!");
      console.log(err);
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
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-gp mb-4">
              <input
                type="email"
                className="form-control"
                name="email"
                placeholder="Email address"
                ref={email}
              />
              <input
                type="text"
                className="form-control"
                name="username"
                placeholder="Username"
                ref={username}
              />
              <select
                name="gender"
                className="form-select mb-3 opacity-75"
                arial-label="Choose Gender"
                ref={gender}
              >
                <option value="">Choose Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>

              <input
                type="password"
                className="form-control"
                name="password"
                placeholder="Password"
                ref={password}
              />
              <input
                type="password"
                className="form-control"
                name="cpassword"
                placeholder="Confirm Password"
                ref={passwordConfirm}
              />
            </div>
            <button
              className="btn btn-primary w-100 fw-bold fs-5 mb-3"
              type="submit"
            >
              Sign Up
            </button>
            <Link to="/login">
              <button className="btn btn-success w-100 fw-bold fs-5 mb-3">
                Log into Account
              </button>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
