// Ensure tests run in a predictable environment
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Provide sane defaults for service URLs in tests if not set
process.env.COLLECTOR_URL = process.env.COLLECTOR_URL || 'http://127.0.0.1:8787';
process.env.GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:8788';

import { config } from 'dotenv';
config({ path: '.env.test' });
process.env.NODE_ENV = 'test';

// Setup for React testing
import '@testing-library/jest-dom';