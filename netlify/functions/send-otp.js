// netlify/functions/send-otp.js
const fetch = require('node-fetch');

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

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
        const { phone } = JSON.parse(event.body);

        // Validate phone number
        if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Invalid phone number. Please enter a valid 10-digit Indian mobile number.' 
                })
            };
        }

        // Generate OTP
        const otp = generateOTP();
        
        // Store OTP with expiration (5 minutes)
        otpStore.set(phone, {
            otp: otp,
            expires: Date.now() + 5 * 60 * 1000, // 5 minutes
            attempts: 0
        });

        // Clean up expired OTPs
        for (const [key, value] of otpStore.entries()) {
            if (Date.now() > value.expires) {
                otpStore.delete(key);
            }
        }

        // Prepare SMS message
        const message = `Your OTP for verification is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;

        // Fast2SMS API call
        const smsResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
                'Authorization': process.env.FAST2SMS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                route: 'v3',
                sender_id: process.env.FAST2SMS_SENDER_ID || 'FSTSMS',
                message: message,
                language: 'english',
                flash: 0,
                numbers: phone
            })
        });

        const smsData = await smsResponse.json();

        if (smsResponse.ok && smsData.return === true) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'OTP sent successfully',
                    messageId: smsData.message_id
                })
            };
        } else {
            // Log the error but don't expose API details
            console.error('Fast2SMS Error:', smsData);
            
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Failed to send SMS. Please try again later.' 
                })
            };
        }

    } catch (error) {
        console.error('Error in send-otp function:', error);
        
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