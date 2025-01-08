import React from 'react';
import Navbar from '../components/Navbar';
import UserBox from '../components/UserBox';

const Users = () => {
    return (
        <div className="min-h-screen bg-white-100" >
            <Navbar />
            <div className="pt-24 px-8 flex flex-wrap items-center gap-8">
                <UserBox
                    profilePic='https://static.vecteezy.com/system/resources/previews/005/544/718/non_2x/profile-icon-design-free-vector.jpg'
                    userId='RandomId'
                    email="example@gmail.com" 
                    userName="Example User"
                    role="admin"
                />
                <UserBox
                    profilePic='https://static.vecteezy.com/system/resources/previews/005/544/718/non_2x/profile-icon-design-free-vector.jpg'
                    userId='RandomId'
                    email="example@gmail.com" 
                    userName="Example User"
                    role="admin"
                />
                <UserBox
                    profilePic='https://static.vecteezy.com/system/resources/previews/005/544/718/non_2x/profile-icon-design-free-vector.jpg'
                    userId='RandomId'
                    email="example@gmail.com" 
                    userName="Example User"
                    role="admin"
                />
                <UserBox
                    profilePic='https://static.vecteezy.com/system/resources/previews/005/544/718/non_2x/profile-icon-design-free-vector.jpg'
                    userId='RandomId'
                    email="example@gmail.com" 
                    userName="Example User"
                    role="admin"
                />
                <UserBox
                    profilePic='https://static.vecteezy.com/system/resources/previews/005/544/718/non_2x/profile-icon-design-free-vector.jpg'
                    userId='RandomId'
                    email="example@gmail.com" 
                    userName="Example User"
                    role="admin"
                />
            </div>
        </div>
    );
};

export default Users;