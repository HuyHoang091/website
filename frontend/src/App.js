import React, { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import { v4 as uuidv4 } from 'uuid';

const App = () => {
    useEffect(() => {
        const tokenJWT = localStorage.getItem('tokenJWT');
        let guestToken = localStorage.getItem('guestToken');

        if (!guestToken) {
            guestToken = uuidv4();
            localStorage.setItem('guestToken', guestToken);
            localStorage.setItem('guestName', `Guest-${guestToken.slice(0, 8)}`);
            localStorage.setItem('guest', 'true');
        }

        if (tokenJWT) {
            localStorage.setItem('guest', 'false');
        }
    }, []);
    return (
        <div>
            <AppRoutes />
        </div>
    );
}

export default App;