/* eslint-disable */
// import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
    //axios return a promise ,so we use async & await
    //axios 'll throw an error when we get an error in our API input for, example:wrong password
    try {
        //send data using http request
        const res = await axios({
            method: 'POST',
            url: 'http://127.0.0.1:3000/api/v1/users/logIn',
            data: {
                email,
                password,
            },
        });

        if (res.data.status === 'success') {
            showAlert('success', 'logged in successfully');
            window.setTimeout(() => {
                //to go to home page
                location.assign('/');
            }, 1500);
        }
    } catch (err) {
        //the same error message that will appeare if you use postman
        showAlert('error', err.response.data.message);
    }
};

export const logout = async () => {
    //axios return a promise ,so we use async & await
    //axios 'll throw an error when we get an error in our API input for, example:wrong password
    try {
        //send data using http request
        const res = await axios({
            method: 'GET',
            url: 'http://127.0.0.1:3000/api/v1/users/logOut',
        });

        if (res.data.status === 'success') location.reload();
        //to reload the same page you're standing in
    } catch (err) {
        console.log(err.response);
        showAlert('error', 'Error logging out! Try again.');
    }
};
