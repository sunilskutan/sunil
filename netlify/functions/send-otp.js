// netlify/functions/send-otp.js
const https = require('https');

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
        const { phone } = JSON.parse(event.body);

        if (!phone) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, message: 'Phone number is required' })
            };
        }

        // Validate phone number format
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Invalid phone number format' 
                })
            };
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Fast2SMS API configuration
        const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY; // Set this in Netlify environment variables
        
        if (!FAST2SMS_API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'SMS service not configured' 
                })
            };
        }

        // SMS message
        const message = `Your OTP for verification is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;

        // Fast2SMS API payload
        const postData = JSON.stringify({
            route: 'otp',
            variables_values: otp,
            flash: 0,
            numbers: phone
        });

        // Alternative payload for different Fast2SMS setup
        const alternativePostData = JSON.stringify({
            route: 'v3',
            sender_id: 'TXTIND',
            message: message,
            language: 'english',
            flash: 0,
            numbers: phone
        });

        const options = {
            hostname: 'www.fast2sms.com',
            port: 443,
            path: '/dev/bulkV2',
            method: 'POST',
            headers: {
                'authorization': FAST2SMS_API_KEY,
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        };

        // Make API call to Fast2SMS
        const smsResponse = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (error) {
                        reject(new Error('Invalid response from SMS service'));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(postData);
            req.end();
        });

        console.log('Fast2SMS Response:', smsResponse);

        if (smsResponse.return === true || smsResponse.status_code === 200) {
            // Store OTP temporarily (in production, use Redis or database)
            // For now, we'll use environment variables or in-memory storage
            // You should implement proper storage mechanism
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'OTP sent successfully',
                    // Don't send OTP in production, this is for testing only
                    // otp: otp 
                })
            };
        } else {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: smsResponse.message || 'Failed to send SMS'
                })
            };
        }

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Failed to send SMS. Please try again later.'
            })
        };
    }
};
