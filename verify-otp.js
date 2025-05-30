// netlify/functions/verify-otp.js

// Import the same OTP store (in production, use a shared database)
const otpStore = new Map();

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
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

        // Validate input
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

        // Check if OTP exists and is valid
        const storedData = otpStore.get(phone);
        
        if (!storedData) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'OTP not found. Please request a new OTP.' 
                })
            };
        }

        // Check if OTP is expired
        if (Date.now() > storedData.expires) {
            otpStore.delete(phone);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'OTP has expired. Please request a new OTP.' 
                })
            };
        }

        // Check attempts limit
        if (storedData.attempts >= 3) {
            otpStore.delete(phone);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Maximum verification attempts exceeded. Please request a new OTP.' 
                })
            };
        }

        // Verify OTP
        if (storedData.otp === otp) {
            // OTP is correct - remove from store
            otpStore.delete(phone);
            
            // Here you can add additional logic like:
            // - Create user session
            // - Generate JWT token
            // - Update database
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'OTP verified successfully',
                    // token: generateJWTToken(phone), // Optional: return JWT token
                    user: {
                        phone: phone,
                        verified: true,
                        verifiedAt: new Date().toISOString()
                    }
                })
            };
        } else {
            // Wrong OTP - increment attempts
            storedData.attempts += 1;
            otpStore.set(phone, storedData);
            
            const remainingAttempts = 3 - storedData.attempts;
            
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
                    remainingAttempts: remainingAttempts
                })
            };
        }

    } catch (error) {
        console.error('Error in verify-otp function:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Internal server error. Please try again later.' 
            })
        };
    }
};

// Optional: JWT token generation function
function generateJWTToken(phone) {
    // Implement JWT token generation here
    // const jwt = require('jsonwebtoken');
    // return jwt.sign({ phone }, process.env.JWT_SECRET, { expiresIn: '24h' });
}