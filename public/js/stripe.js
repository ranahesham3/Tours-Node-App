/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
    const stripe = Stripe(
        'pk_test_51RcDxQPEfBijR8K9C00BPdlzia0bu4W60MAFNlESwMQflHXoH5mrXVI7NUELPXEgTlL2fcbf4xFkiZiyBwBZYMQC003MEHq1em',
    );

    try {
        //1)get checkout session from API

        //because we 're only doing a simple get request
        const session = await axios(
            `/api/v1/bookings/checkout-session/${tourId}`,
        );
        //2)create checkout form+charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id,
        });
        // if (res.status === 200) location.assign(res.data.data.url);
    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }
};
