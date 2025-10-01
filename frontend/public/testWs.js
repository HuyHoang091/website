// test-websocket.js
// Requires stompjs and sockjs-client to be included in the project
// Example: <script src="https://cdnjs.cloudflare.com/ajax/libs/sockjs-client/1.6.1/sockjs.min.js"></script>
//          <script src="https://cdnjs.cloudflare.com/ajax/libs/stomp.js/2.3.3/stomp.min.js"></script>

// Configuration
const WEBSOCKET_URL = 'http://localhost:8080/ws'; // Adjust to your server URL
const SALE_USER_ID = 'sale1'; // Simulated sale user ID
const CLIENT_USER_ID = 'user1'; // Simulated client user ID
const CLIENT_NAME = 'John Doe'; // Simulated client name
const SALE_NAME = 'Sale Agent'; // Simulated sale name

// Global variables for STOMP clients
let saleClient;
let userClient;

// Connect as a Sale user
function connectSale() {
    const socket = new SockJS(`${WEBSOCKET_URL}?userId=${SALE_USER_ID}`);
    saleClient = Stomp.over(socket);

    saleClient.connect({}, (frame) => {
        console.log('Sale connected:', frame);

        // Subscribe to sale-specific queue
        saleClient.subscribe(`/user/queue/sale`, (message) => {
            console.log('Sale received:', JSON.parse(message.body));
        });

        // Register sale
        saleClient.send('/app/registerSale', {}, {});
        console.log('Sale registration sent');
    }, (error) => {
        console.error('Sale connection error:', error);
    });
}

// Connect as a regular user
function connectUser() {
    const socket = new SockJS(`${WEBSOCKET_URL}?userId=${CLIENT_USER_ID}`);
    userClient = Stomp.over(socket);

    userClient.connect({}, (frame) => {
        console.log('User connected:', frame);

        // Subscribe to user-specific queue
        userClient.subscribe(`/user/queue/user`, (message) => {
            console.log('User received:', JSON.parse(message.body));
        });

        // Send a user message after a short delay to ensure sale is registered
        setTimeout(() => {
            sendUserMessage();
        }, 3000);
    }, (error) => {
        console.error('User connection error:', error);
    });
}

// Send a message from user to sale
function sendUserMessage() {
    const payload = {
        from: CLIENT_USER_ID,
        fromName: CLIENT_NAME,
        type: 'message', // Adjust based on Chat.TYPE enum in your backend
        content: 'Hello, I have a question about your products!',
        clientId: CLIENT_USER_ID
    };

    userClient.send('/app/userMessage', {}, JSON.stringify(payload));
    console.log('User message sent:', payload);
}

// Send a message from sale to user
function sendSaleMessage() {
    const payload = {
        from: SALE_USER_ID,
        fromName: SALE_NAME,
        to: CLIENT_USER_ID,
        toName: CLIENT_NAME,
        type: 'message',
        content: 'Hi, thanks for your interest! How can I assist you?',
        clientId: CLIENT_USER_ID
    };

    saleClient.send('/app/saleMessage', {}, JSON.stringify(payload));
    console.log('Sale message sent:', payload);
}

// Disconnect clients
function disconnectClients() {
    if (userClient) {
        userClient.disconnect(() => {
            console.log('User disconnected');
        });
    }
    if (saleClient) {
        saleClient.disconnect(() => {
            console.log('Sale disconnected');
        });
    }
}

// Run the test sequence
function runTests() {
    console.log('Starting WebSocket tests...');

    // Connect sale first
    connectSale();

    // Connect user after a short delay to ensure sale is connected
    setTimeout(() => {
        connectUser();

        // Send a sale message after a delay to simulate response
        setTimeout(() => {
            sendSaleMessage();

            // Disconnect after another delay to clean up
            setTimeout(() => {
                disconnectClients();
                console.log('Tests completed.');
            }, 2000);
        }, 2000);
    }, 1000);
}

// Execute tests when the page loads
window.onload = function() {
    runTests();
};