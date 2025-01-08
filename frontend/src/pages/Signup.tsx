import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        repeatPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('http://localhost:5000/api/auth/register', formData);
            navigate('/login');
        } catch (error) {
            console.error('Error during registration:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center sm:py-12">
            <div className="p-10 xs:p-0 mx-auto md:w-full md:max-w-md">
                <h1 className="font-bold text-center text-2xl mb-5">Your Logo</h1>
                <div className="bg-white shadow w-full rounded-lg divide-y divide-gray-200">
                    <div className="px-5 py-7">
                        <form onSubmit={handleSubmit}>
                            <label className="font-semibold text-sm text-gray-600 pb-1 block">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full"
                                placeholder="Enter your username"
                                required
                            />
                            <label className="font-semibold text-sm text-gray-600 pb-1 block">E-mail</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full"
                                placeholder="Enter your email"
                                required
                            />
                            <label className="font-semibold text-sm text-gray-600 pb-1 block">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full"
                                placeholder="Enter your password"
                                required
                            />
                            <label className="font-semibold text-sm text-gray-600 pb-1 block">Repeat Password</label>
                            <input
                                type="password"
                                name="repeatPassword"
                                value={formData.repeatPassword}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full"
                                placeholder="Repeat your password"
                                required
                            />
                            <button
                                type="submit"
                                className="transition duration-200 bg-blue-500 hover:bg-blue-600 focus:bg-blue-700 focus:shadow-sm focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 text-white w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-semibold text-center inline-block"
                            >
                                <span className="inline-block mr-2">Sign Up</span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    className="w-4 h-4 inline-block"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </button>
                        </form>
                    </div>
                    <div className="py-5">
                        <div className="text-center sm:text-right whitespace-nowrap">
                            <div className="flex justify-center">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="transition duration-200 mx-5 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-200 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ring-inset"
                                >
                                    <span className="inline-block ml-1 text-center">Already have an account? Login</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;