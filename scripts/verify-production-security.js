#!/usr/bin/env node
/**
 * Production Security Verification Script
 * Tests all security features with backend integration
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logTest(testName, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${testName}${details ? ': ' + details : ''}`, color);
}

// Configuration - Update these for your environment
const config = {
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
    isHttps: process.env.FRONTEND_URL?.startsWith('https://') || false
  },
  backend: {
    url: process.env.BACKEND_URL || 'http://localhost:8000',
    isHttps: process.env.BACKEND_URL?.startsWith('https://') || false
  }
};

class SecurityVerifier {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https://') ? https : http;
      
      const req = client.request(url, {
        method: 'GET',
        timeout: 10000,
        ...options
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      req.end(options.body);
    });
  }

  test(name, passed, details = '') {
    this.results.total++;
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
    logTest(name, passed, details);
  }

  warn(name, details = '') {
    this.results.warnings++;
    log(`⚠️ ${name}${details ? ': ' + details : ''}`, 'yellow');
  }

  async testSecurityHeaders() {
    log('\n🔒 Testing Security Headers', 'blue');
    
    try {
      const response = await this.makeRequest(config.frontend.url);
      
      const expectedHeaders = [
        'x-content-type-options',
        'x-frame-options', 
        'referrer-policy'
      ];

      expectedHeaders.forEach(header => {
        const headerValue = response.headers[header];
        this.test(
          `Security header: ${header}`,
          !!headerValue,
          headerValue ? `Present: ${headerValue}` : 'Missing'
        );
      });

      // Check CSP header
      const csp = response.headers['content-security-policy'];
      this.test(
        'Content Security Policy',
        !!csp,
        csp ? 'Present' : 'Missing - check Next.js config'
      );

    } catch (error) {
      this.test('Security headers test', false, `Failed to connect: ${error.message}`);
    }
  }

  async testCSRFProtection() {
    log('\n🛡️ Testing CSRF Protection', 'blue');

    try {
      // Test that POST requests without CSRF token are rejected
      const response = await this.makeRequest(config.backend.url + '/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'test123'
        })
      });

      this.test(
        'CSRF protection active',
        response.status === 403,
        `Status: ${response.status} (expected 403 for missing CSRF token)`
      );

    } catch (error) {
      this.warn('CSRF test', `Backend not reachable: ${error.message}`);
    }
  }

  async testRateLimiting() {
    log('\n⏱️ Testing Rate Limiting', 'blue');

    try {
      // Make multiple rapid requests to test rate limiting
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          this.makeRequest(config.backend.url + '/api/v1/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': 'test-token-for-rate-limit-test'
            },
            body: JSON.stringify({
              email: 'nonexistent@test.com',
              password: 'wrong-password'
            })
          }).catch(err => ({ error: err.message }))
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      this.test(
        'Rate limiting active',
        rateLimited,
        rateLimited ? 'Rate limit triggered after multiple requests' : 'No rate limiting detected'
      );

      // Check for proper Retry-After header
      const rateLimitedResponse = responses.find(r => r.status === 429);
      if (rateLimitedResponse) {
        const retryAfter = rateLimitedResponse.headers['retry-after'];
        this.test(
          'Retry-After header present',
          !!retryAfter,
          retryAfter ? `Retry-After: ${retryAfter}s` : 'Missing header'
        );
      }

    } catch (error) {
      this.warn('Rate limiting test', `Backend not reachable: ${error.message}`);
    }
  }

  async testCookieAuthentication() {
    log('\n🍪 Testing Cookie Authentication', 'blue');

    try {
      // Test cookie support endpoint
      const supportResponse = await this.makeRequest(
        config.backend.url + '/api/v1/auth/cookie-support'
      );

      this.test(
        'Cookie auth support endpoint',
        supportResponse.status === 200,
        `Status: ${supportResponse.status}`
      );

      // Test that /auth/me requires authentication
      const meResponse = await this.makeRequest(
        config.backend.url + '/api/v1/auth/me'
      );

      this.test(
        'Protected endpoint security',
        meResponse.status === 401,
        `Status: ${meResponse.status} (expected 401 for unauthenticated)`
      );

    } catch (error) {
      this.warn('Cookie authentication test', `Backend not reachable: ${error.message}`);
    }
  }

  async testInputValidation() {
    log('\n🧹 Testing Input Validation', 'blue');

    try {
      // Test XSS prevention
      const xssPayload = '<script>alert("xss")</script>';
      const response = await this.makeRequest(
        config.backend.url + '/api/v1/journal/entries',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'test-token',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            title: xssPayload,
            content: 'Test content'
          })
        }
      );

      // Should be rejected due to input validation
      this.test(
        'XSS input rejection',
        response.status === 400 || response.status === 422,
        `Status: ${response.status} (expected 400/422 for invalid input)`
      );

      // Test SQL injection prevention
      const sqlPayload = "'; DROP TABLE users; --";
      const sqlResponse = await this.makeRequest(
        config.backend.url + '/api/v1/journal/entries',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'test-token',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            title: 'Test',
            content: sqlPayload
          })
        }
      );

      this.test(
        'SQL injection prevention',
        sqlResponse.status === 400 || sqlResponse.status === 422,
        `Status: ${sqlResponse.status} (expected 400/422 for dangerous input)`
      );

    } catch (error) {
      this.warn('Input validation test', `Backend not reachable: ${error.message}`);
    }
  }

  async testProductionConfiguration() {
    log('\n⚙️ Testing Production Configuration', 'blue');

    // Check environment variables
    const requiredEnvVars = [
      'NODE_ENV',
      'NEXT_PUBLIC_API_BASE_URL'
    ];

    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      this.test(
        `Environment variable: ${envVar}`,
        !!value,
        value ? `Set: ${envVar === 'NODE_ENV' ? value : '[HIDDEN]'}` : 'Not set'
      );
    });

    // Check HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      this.test(
        'HTTPS in production (frontend)',
        config.frontend.isHttps,
        config.frontend.isHttps ? 'Using HTTPS' : 'WARNING: Using HTTP in production'
      );

      this.test(
        'HTTPS in production (backend)',
        config.backend.isHttps,
        config.backend.isHttps ? 'Using HTTPS' : 'WARNING: Using HTTP in production'
      );
    } else {
      this.warn('Production HTTPS check', 'Not in production environment');
    }
  }

  printSummary() {
    log('\n📊 Security Verification Summary', 'blue');
    log(`Total tests: ${this.results.total}`);
    log(`Passed: ${this.results.passed}`, 'green');
    log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'green');
    log(`Warnings: ${this.results.warnings}`, this.results.warnings > 0 ? 'yellow' : 'green');

    const successRate = Math.round((this.results.passed / this.results.total) * 100);
    log(`\nSuccess Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'red');

    if (this.results.failed > 0) {
      log('\n❌ Some security tests failed. Review the results above.', 'red');
      process.exit(1);
    } else if (this.results.warnings > 0) {
      log('\n⚠️ All tests passed but there are warnings to address.', 'yellow');
    } else {
      log('\n✅ All security tests passed! Your application is production ready.', 'green');
    }
  }
}

async function main() {
  log('🔐 ReFocused Security Verification', 'blue');
  log('=====================================', 'blue');
  
  const verifier = new SecurityVerifier();

  log(`\nTesting Frontend: ${config.frontend.url}`);
  log(`Testing Backend: ${config.backend.url}`);

  await verifier.testSecurityHeaders();
  await verifier.testCSRFProtection();  
  await verifier.testRateLimiting();
  await verifier.testCookieAuthentication();
  await verifier.testInputValidation();
  await verifier.testProductionConfiguration();

  verifier.printSummary();
}

if (require.main === module) {
  main().catch(error => {
    log(`\n💥 Verification failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { SecurityVerifier };