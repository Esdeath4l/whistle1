# Whistle App Security Documentation

## Overview
This document outlines the security measures implemented in the Whistle anonymous reporting application and provides procedures for maintaining security.

## Security Architecture

### 1. Encryption & Data Protection
- **End-to-End Encryption**: All sensitive report data is encrypted using AES-256 encryption
- **Key Management**: Encryption keys are stored in environment variables, never in code
- **Client-Side Encryption**: Report data is encrypted on the client before transmission
- **Secure Storage**: All encrypted data includes initialization vectors (IV) for enhanced security

### 2. Authentication & Authorization
- **JWT Tokens**: Secure JSON Web Tokens with 1-hour expiration
- **HTTP-Only Cookies**: Session tokens stored in secure, HTTP-only cookies
- **Password Hashing**: bcrypt with salt rounds of 12 for password storage
- **Rate Limiting**: Authentication endpoints limited to 5 attempts per 15 minutes

### 3. Network Security
- **CORS Protection**: Strict origin validation for cross-origin requests
- **CSP Headers**: Content Security Policy prevents XSS attacks
- **Helmet.js**: Comprehensive security headers protection
- **Request Size Limits**: Body size limited to 10KB to prevent DoS attacks

### 4. Application Security
- **Input Validation**: All user inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries and ORM usage
- **XSS Prevention**: Output encoding and CSP headers
- **CSRF Protection**: SameSite cookie attributes

## Environment Variables

### Required Security Variables
```bash
# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=your_32_byte_hex_encryption_key_here

# Generate with: openssl rand -hex 32  
JWT_SECRET=your_jwt_secret_key_here

# Strong admin credentials
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_admin_password

# Email configuration (if needed)
EMAIL_USER=your_email@domain.com
EMAIL_APP_PASSWORD=your_app_specific_password
```

### Security Best Practices for Environment Variables
1. **Never commit `.env` files** to version control
2. **Use strong, random values** for all secrets
3. **Rotate credentials regularly** (see rotation procedures below)
4. **Use different values** for development, staging, and production
5. **Limit access** to environment variable storage systems

## Key Rotation Procedures

### 1. Encryption Key Rotation
**Frequency**: Every 90 days or immediately if compromised

**Procedure**:
1. Generate new encryption key: `openssl rand -hex 32`
2. Update environment variable: `ENCRYPTION_KEY=new_key`
3. Deploy to all environments simultaneously
4. Verify all services can decrypt existing data
5. Update backup/recovery procedures with new key

**Emergency Rotation**:
1. Immediately update all environment variables
2. Invalidate all existing sessions
3. Force re-authentication of all users
4. Review access logs for suspicious activity

### 2. JWT Secret Rotation
**Frequency**: Every 30 days or immediately if compromised

**Procedure**:
1. Generate new JWT secret: `openssl rand -hex 32`
2. Update environment variable: `JWT_SECRET=new_secret`
3. Deploy to all services
4. All users will need to re-authenticate
5. Monitor for authentication errors

### 3. Admin Password Rotation
**Frequency**: Every 60 days or immediately if compromised

**Procedure**:
1. Generate strong new password (minimum 16 characters)
2. Update environment variable: `ADMIN_PASSWORD=new_password`
3. Deploy to all environments
4. Test admin authentication
5. Update documentation and notify admin users

## Incident Response Plan

### 1. Security Incident Classification
- **Critical**: Data breach, unauthorized access to admin panel
- **High**: Failed encryption, authentication bypass
- **Medium**: Unusual access patterns, rate limit violations
- **Low**: Failed login attempts, minor configuration issues

### 2. Immediate Response Actions
1. **Assess the threat**: Determine scope and impact
2. **Contain the incident**: Block malicious IPs, disable compromised accounts
3. **Preserve evidence**: Save logs, take system snapshots
4. **Notify stakeholders**: Follow communication protocols
5. **Begin remediation**: Apply patches, rotate credentials

### 3. Recovery Procedures
1. **Credential Rotation**: Immediately rotate all potentially compromised credentials
2. **System Hardening**: Apply additional security measures
3. **Monitoring Enhancement**: Increase logging and alerting
4. **Vulnerability Assessment**: Conduct thorough security audit
5. **Documentation Update**: Record lessons learned and update procedures

## Security Monitoring

### 1. Key Metrics to Monitor
- Failed authentication attempts
- Unusual access patterns
- Rate limit violations
- Error rates in encryption/decryption
- Admin panel access logs

### 2. Alerting Rules
- **Immediate**: 5+ failed admin logins in 5 minutes
- **Within 1 hour**: Rate limit violations
- **Daily**: Summary of all security events
- **Weekly**: Security health check report

### 3. Log Retention
- **Security logs**: 90 days minimum
- **Admin access logs**: 1 year
- **Error logs**: 30 days
- **Performance logs**: 7 days

## Vulnerability Management

### 1. Regular Security Assessments
- **Monthly**: Dependency vulnerability scans
- **Quarterly**: Full application penetration testing
- **Annually**: Comprehensive security audit

### 2. Patch Management
- **Critical vulnerabilities**: Patch within 24 hours
- **High vulnerabilities**: Patch within 7 days
- **Medium vulnerabilities**: Patch within 30 days
- **Low vulnerabilities**: Patch with next release cycle

### 3. Security Updates
- Keep all dependencies up to date
- Monitor security advisories for used packages
- Test security patches in staging before production deployment

## Compliance & Privacy

### 1. Data Protection
- All personal data is encrypted at rest and in transit
- Anonymous reporting preserves user privacy
- Admin access is logged and auditable
- Data retention policies are enforced

### 2. Access Controls
- Principle of least privilege
- Multi-factor authentication for admin access
- Regular access reviews and cleanup
- Strong password requirements

## Emergency Contacts

### Security Team
- Primary: [Your Security Lead Email]
- Secondary: [Your Backup Contact Email]
- Emergency Hotline: [Your Emergency Number]

### Escalation Procedures
1. **Level 1**: Development team response (< 1 hour)
2. **Level 2**: Security team involvement (< 4 hours)
3. **Level 3**: Executive notification (< 24 hours)
4. **Level 4**: External authorities if required

## Security Training

### 1. Required Training
- Secure coding practices
- Incident response procedures
- Data handling protocols
- Social engineering awareness

### 2. Training Schedule
- **New employees**: Within first week
- **Annual refresher**: All staff
- **Security updates**: As needed

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Next Review**: Quarterly  
**Approved By**: Security Team

> **Important**: This is a living document. Update it whenever security procedures change or after security incidents.
