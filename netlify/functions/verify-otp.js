// netlify/functions/verify-otp.js

exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        const { phone, otp } = JSON.parse(event.body);

        if (!phone || !otp) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Phone number and OTP are required' 
                })
            };
        }

        // Validate OTP format
        if (!/^\d{6}$/.test(otp)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Invalid OTP format' 
                })
            };
        }

        // In a real application, you would:
        // 1. Retrieve the stored OTP for this phone number from your database/Redis
        // 2. Check if it matches and hasn't expired
        // 3. Implement rate limiting and attempt tracking

        // For demonstration purposes, we'll simulate verification
        // In production, replace this with actual OTP verification logic
        
        // Example verification logic (replace with your actual storage mechanism)
        const storedOTP = await getStoredOTP(phone); // Implement this function
        const currentTime = Date.now();
        
        if (!storedOTP) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'OTP expired or not found. Please request a new OTP.'
                })
            };
        }

        // Check if OTP matches
        if (storedOTP.otp !== otp) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Invalid OTP'
                })
            };
        }

        // Check if OTP has expired (5 minutes = 300000 ms)
        if (currentTime - storedOTP.timestamp > 300000) {
            await deleteStoredOTP(phone); // Clean up expired OTP
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'OTP has expired. Please request a new OTP.'
                })
            };
        }

        // OTP is valid, clean up
        await deleteStoredOTP(phone);

        // You can also generate and return a JWT token here for authentication
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'OTP verified successfully',
                // token: generateJWTToken(phone) // Optional: generate auth token
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Verification failed. Please try again.'
            })
        };
    }
};

// Simple in-memory storage (replace with proper database/Redis in production)
const otpStorage = new Map();

async function getStoredOTP(phone) {
    return otpStorage.get(phone) || null;
}

async function deleteStoredOTP(phone) {
    otpStorage.delete(phone);
}

// You'll need to implement this in your send-otp function
function storeOTP(phone, otp) {
    otpStorage.set(phone, {
        otp: otp,
        timestamp: Date.now()
    });
}
