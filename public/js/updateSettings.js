/* eslint-disable */
import { showAlert } from './alerts';

//data is an object for all the data that we  'll need to update &
//type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
    //axios return a promise ,so we use async & await
    //axios 'll throw an error when we get an error in our API input for, example:wrong password
    try {
        //send data using http request
        ///updateMyPassword
        const url =
            type === 'password'
                ? '/api/v1/users/updateMyPassword'
                : '/api/v1/users/updateMe';
        const res = await axios({
            method: 'PATCH',
            url,
            data,
        });

        if (res.data.status === 'success') {
            showAlert('success', `${type} is updated successfully`);
            window.setTimeout(() => {
                //to go to home page
                location.reload();
            }, 1500);
        }
    } catch (err) {
        //the same error message that will appeare if you use postman
        showAlert('error', err.response.data.message);
    }
};
