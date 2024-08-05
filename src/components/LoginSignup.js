import React, { useState } from "react";
import logo from "../assets/logo.png";
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginSignup() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const toggleForm = () => setIsSignUp(!isSignUp)
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);
  const navigate = useNavigate();

  const handlePaste = (event) => {
    event.preventDefault();
  };

  const signUp = async () => {
    try {
      if(password === confirmPassword){
      const res = await axios.post(`${process.env.REACT_APP_AUTH_MICROSERVICE_URL}/auth/signup`, {
        name,
        email,
        phone,
        password,
      });
      navigate("/auth/verify-otp", { state: { email } });
      console.log(res); // log the response data
    }else{
      alert("Password and confirm password must be same!")
    }
    } catch (error) {
      console.error("There was an error signing up!", error.response ? error.response.data : error.message);
    }
  };

  const signIn = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_AUTH_MICROSERVICE_URL}/auth/signin`, {
        email,
        password,
      });
      console.log(res); // log the response data
      navigate('/dashboard');
    } catch (error) {
      console.error("There was an error signing in!", error.response ? error.response.data : error.message);
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault(); // Prevent the default form submission
    if (isSignUp) {
      signUp();
    } else {
      signIn();
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img alt="Your Company" src={logo} className="mx-auto h-14 w-auto" />
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {isSignUp ? "Sign up for an account" : "Sign in to your account"}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
          {isSignUp && (
            <div>
              <label htmlFor="name" className="flex block text-sm font-medium leading-6 text-gray-900">
                Full Name
              </label>
              <div className="mt-2">
                <input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John senior"
                  required
                  autoComplete="name"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="flex block text-sm font-medium leading-6 text-gray-900">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dexkor@example.com"
                type="email"
                required
                autoComplete="email"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label htmlFor="phone" className="flex block text-sm font-medium leading-6 text-gray-900">
                Phone Number
              </label>
              <div className="mt-2">
                <input
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="7780936392"
                  type="tel"
                  required
                  autoComplete="tel"
                  pattern="[0-9]*"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="password" className="flex text-sm font-medium leading-6 text-gray-900">
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Type a strong password"
                required
                autoComplete="current-password"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                onPaste={handlePaste}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-2 mr-2 right-0 hover:bg-white flex items-center pr-3 bg-white"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label htmlFor="confirm-password" className="flex block text-sm font-medium leading-6 text-gray-900">
                Confirm Password
              </label>
              <div className="relative mt-2">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  onPaste={handlePaste}
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute inset-y-2 mr-2 right-0 hover:bg-white flex items-center pr-3 bg-white"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="flex ml-0 w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {isSignUp ? "Sign up" : "Sign in"}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-500">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <a href="#" onClick={toggleForm} className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
                Sign in
              </a>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <a href="#" onClick={toggleForm} className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
                Sign up
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default LoginSignup
