// tests/adminAPI.test.js
const request = require('supertest');
const app = require('../app'); // Your Express app
const mongoose = require('mongoose');
const User = require('../models/users'); // Your User model

describe('Admin API Tests', () => {
    let adminToken;
    let testUserId;
    let testFormId;
    let testMaterialId;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.TEST_DB_URI);

        // Create test admin user if not exists
        const admin = await User.findOne({ username: 'testadmin' });
        if (!admin) {
            await User.create({
                username: 'testadmin',
                password: 'hashedpassword', // Use your hash function
                roles: ['admin']
            });
        }
    });

    afterAll(async () => {
        // Clean up and disconnect
        await User.deleteMany({ username: { $in: ['testadmin', 'testuser'] } });
        await mongoose.disconnect();
    });

    describe('Authentication', () => {
        test('Admin login should return token', async () => {
            const response = await request(app)
                .post('/api/v1/admin/login-admin')
                .send({
                    username: 'testadmin',
                    password: 'admin123'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.token).toBeDefined();
            adminToken = response.body.token;
        });

        test('Invalid login should return 401', async () => {
            const response = await request(app)
                .post('/api/v1/admin/login-admin')
                .send({
                    username: 'wronguser',
                    password: 'wrongpass'
                });

            expect(response.statusCode).toBe(401);
        });
    });

    describe('User Management', () => {
        test('Create user should return 201', async () => {
            const response = await request(app)
                .post('/api/v1/admin/create-user')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    username: 'testuser',
                    password: 'testpass123',
                    roles: ['user']
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.username).toBe('testuser');
            testUserId = response.body.id;
        });

        test('Get all users should return paginated results', async () => {
            const response = await request(app)
                .get('/api/v1/admin/user')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toBeDefined();
        });
    });

    describe('Form Management', () => {
        test('Create form should return 201', async () => {
            const response = await request(app)
                .post('/api/v1/admin/create-form')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Test Form',
                    description: 'Test Description'
                });

            expect(response.statusCode).toBe(201);
            testFormId = response.body.id;
        });

        test('Add question to form should return 201', async () => {
            const response = await request(app)
                .post(`/api/v1/admin/form/${testFormId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    questionText: 'Test Question?',
                    questionType: 'multiple-choice',
                    options: ['Option 1', 'Option 2'],
                    order: 1
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.questionText).toBe('Test Question?');
        });
    });

    describe('Material Management', () => {
        test('Create material should return 201', async () => {
            const response = await request(app)
                .post('/api/v1/admin/create-material')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Material',
                    details: 'Test Details',
                    sourceFrom: 'Test Source'
                });

            expect(response.statusCode).toBe(201);
            testMaterialId = response.body.id;
        });

        test('Add sub-material should return 201', async () => {
            const response = await request(app)
                .post(`/api/v1/admin/material/${testMaterialId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Sub-Material',
                    details: 'Test Sub Details'
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.materialId).toBe(testMaterialId);
        });
    });

    describe('Error Handling', () => {
        test('Unauthorized access should return 401', async () => {
            const response = await request(app)
                .get('/api/v1/admin/user');

            expect(response.statusCode).toBe(401);
        });

        test('Invalid input should return 400', async () => {
            const response = await request(app)
                .post('/api/v1/admin/create-user')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    username: '', // Invalid
                    password: 'short' // Invalid
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBeDefined();
        });
    });
});