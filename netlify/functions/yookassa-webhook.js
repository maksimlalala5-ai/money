const admin = require('firebase-admin');
const crypto = require('crypto');

// Инициализация Firebase Admin
if (!admin.apps.length) {
    try {
        // Используем переменную окружения FIREBASE_ADMIN_CREDENTIALS
        if (!process.env.FIREBASE_ADMIN_CREDENTIALS) {
            throw new Error('FIREBASE_ADMIN_CREDENTIALS environment variable is not set');
        }
        
        const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
            
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('Firebase admin initialization error:', error);
    }
}

exports.handler = async function(event, context) {
    console.log('Webhook received:', event.httpMethod);
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { event: eventType, object } = body;

        // Проверка подписи вебхука (если задан секрет)
        const webhookSecret = process.env.YOOKASSA_WEBHOOK_SECRET;
        const headersLower = {};
        Object.keys(event.headers || {}).forEach(k => headersLower[k.toLowerCase()] = event.headers[k]);
        const signatureHeader = headersLower['x-webhook-signature'] || headersLower['x-signature'] || headersLower['x-yookassa-signature'];

        if (webhookSecret) {
            if (!signatureHeader) {
                console.error('Webhook signature missing');
                return { statusCode: 401, headers, body: JSON.stringify({ error: 'Signature missing' }) };
            }

            try {
                const expected = crypto.createHmac('sha256', webhookSecret).update(event.body || '').digest('hex');
                if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))) {
                    console.error('Invalid webhook signature');
                    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid signature' }) };
                }
            } catch (sigErr) {
                console.error('Signature verification error:', sigErr);
                return { statusCode: 401, headers, body: JSON.stringify({ error: 'Signature verification failed' }) };
            }
        } else {
            console.warn('YOOKASSA_WEBHOOK_SECRET not set — пропуск проверки подписи');
        }
        
        console.log('Webhook event:', eventType, 'paymentId:', object?.id);

        if (eventType === 'payment.succeeded') {
            const { userId, userEmail } = object.metadata || {};
            
            if (userId) {
                const db = admin.firestore();
                
                // Обновляем подписку пользователя
                await db.collection('users').doc(userId).update({
                    subscription: 'premium',
                    subscriptionActive: true,
                    trialEndDate: null,
                    lastPaymentDate: new Date().toISOString(),
                    paymentId: object.id,
                    premiumSince: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
                // Сохраняем детали платежа
                await db.collection('payments').add({
                    userId,
                    paymentId: object.id,
                    amount: object.amount?.value || 199,
                    currency: object.amount?.currency || 'RUB',
                    status: 'succeeded',
                    metadata: object.metadata,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
                console.log('Premium subscription activated for user:', userId);
                
                // Отправляем email подтверждения
                if (userEmail) {
                    try {
                        // Вызовяем локальную функцию отправки email напрямую
                        const sendEmail = require('./send-email.js');
                        const emailEvent = {
                            httpMethod: 'POST',
                            body: JSON.stringify({
                                to_email: userEmail,
                                user_name: object.metadata?.userName || 'Пользователь',
                                type: 'payment_success'
                            })
                        };

                        // handler возвращает объект ответа
                        await sendEmail.handler(emailEvent, {});
                    } catch (emailError) {
                        console.error('Error sending success email:', emailError);
                    }
                }
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                received: true,
                processed: true,
                event: eventType 
            })
        };

    } catch (error) {
        console.error('Webhook processing error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal Server Error',
                message: error.message 
            })
        };
    }
};