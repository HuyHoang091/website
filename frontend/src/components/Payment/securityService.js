/**
 * Generate signature for payment verification
 * IMPORTANT: In production, this should be done on the server side
 * Never expose secret keys in client-side code
 * 
 * @param {number} amount - Payment amount
 * @param {number} timestamp - Current timestamp
 * @returns {string} Signature hash
 */
export const generateSignature = (amount, timestamp) => {
    // WARNING: This is for demonstration only
    // In production, call your server API to generate signature
    // Example:
    // const response = await fetch('/api/generate-signature', {
    //   method: 'POST',
    //   body: JSON.stringify({ amount, timestamp })
    // });
    // return response.signature;
    
    const secret = "your-secret-key-should-be-on-server";
    const data = `${amount}:${timestamp}:${secret}`;
    
    try {
        return btoa(data).substring(0, 20);
    } catch (err) {
        console.error("Error generating signature:", err);
        return "";
    }
};

/**
 * Verify signature (should be done on server)
 * @param {string} signature 
 * @param {number} amount 
 * @param {number} timestamp 
 * @returns {boolean}
 */
export const verifySignature = (signature, amount, timestamp) => {
    // In production, this verification should happen on the server
    const expectedSignature = generateSignature(amount, timestamp);
    return signature === expectedSignature;
};