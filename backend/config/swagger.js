import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BiteBlitz API Documentation',
            version: '1.0.0',
            description: 'The backend API for the BiteBlitz food delivery application featuring JWT authentication, WebSockets, and Stripe payments.',
        },
        servers: [
            {
                url: 'http://localhost:4000',
                description: 'Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT access token here (e.g. from /api/user/login).',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Paths to files containing OpenAPI definitions
    apis: ['./routes/*.js', './controllers/*.js'], // Documenting through annotations in routes/controllers
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
