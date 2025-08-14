const { SecurityUtils } = require('../config/security');

class SecurityMonitor {
  constructor() {
    this.securityEvents = [];
    this.threatLevel = 'low';
    this.blockedIPs = new Set();
    this.suspiciousUsers = new Map();
    this.rateLimitViolations = new Map();
    this.maxEvents = 1000; // Keep last 1000 events
    this.alertThresholds = {
      suspiciousRequests: 10, // Alert after 10 suspicious requests
      failedLogins: 5, // Alert after 5 failed logins
      fileUploadAttempts: 3, // Alert after 3 suspicious file uploads
      socketAbuse: 20 // Alert after 20 socket events per minute
    };
  }

  // Log security event
  logEvent(event, details = {}) {
    const securityEvent = {
      id: SecurityUtils.generateSecureString(16),
      timestamp: new Date().toISOString(),
      event,
      details,
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
      userId: details.userId || 'anonymous',
      severity: details.severity || 'info',
      threatLevel: this.calculateThreatLevel(event, details)
    };

    this.securityEvents.push(securityEvent);
    
    // Keep only last maxEvents
    if (this.securityEvents.length > this.maxEvents) {
      this.securityEvents.shift();
    }

    // Log to console
    console.log(`🔒 SECURITY [${securityEvent.threatLevel.toUpperCase()}]: ${event}`, securityEvent);

    // Check for threats and trigger alerts
    this.checkThreats(securityEvent);

    return securityEvent;
  }

  // Calculate threat level for an event
  calculateThreatLevel(event, details) {
    const highThreatEvents = [
      'SQL_INJECTION_ATTEMPT',
      'XSS_ATTEMPT',
      'FILE_UPLOAD_ABUSE',
      'BRUTE_FORCE_ATTACK',
      'UNAUTHORIZED_ACCESS',
      'TOKEN_THEFT',
      'RATE_LIMIT_VIOLATION'
    ];

    const mediumThreatEvents = [
      'SUSPICIOUS_REQUEST',
      'MULTIPLE_FAILED_LOGINS',
      'UNUSUAL_ACTIVITY',
      'DEVICE_MISMATCH',
      'SOCKET_ABUSE'
    ];

    if (highThreatEvents.includes(event)) {
      return 'high';
    } else if (mediumThreatEvents.includes(event)) {
      return 'medium';
    } else if (details.severity === 'high') {
      return 'high';
    } else if (details.severity === 'medium') {
      return 'medium';
    }

    return 'low';
  }

  // Check for threats and trigger alerts
  checkThreats(securityEvent) {
    const { ip, event, userId } = securityEvent;

    // Track suspicious IPs
    if (securityEvent.threatLevel === 'high') {
      this.blockedIPs.add(ip);
      this.logEvent('IP_BLOCKED', {
        ip,
        reason: `High threat event: ${event}`,
        severity: 'high'
      });
    }

    // Track suspicious users
    if (userId !== 'anonymous') {
      if (!this.suspiciousUsers.has(userId)) {
        this.suspiciousUsers.set(userId, []);
      }
      this.suspiciousUsers.get(userId).push(securityEvent);
    }

    // Check for rate limit violations
    if (event === 'RATE_LIMIT_VIOLATION') {
      if (!this.rateLimitViolations.has(ip)) {
        this.rateLimitViolations.set(ip, 0);
      }
      this.rateLimitViolations.set(ip, this.rateLimitViolations.get(ip) + 1);
    }

    // Trigger alerts based on thresholds
    this.checkAlertThresholds(ip, userId);
  }

  // Check alert thresholds
  checkAlertThresholds(ip, userId) {
    // Check suspicious requests
    const suspiciousRequests = this.securityEvents.filter(
      event => event.ip === ip && event.event === 'SUSPICIOUS_REQUEST'
    ).length;

    if (suspiciousRequests >= this.alertThresholds.suspiciousRequests) {
      this.triggerAlert('SUSPICIOUS_ACTIVITY', {
        ip,
        userId,
        count: suspiciousRequests,
        threshold: this.alertThresholds.suspiciousRequests,
        severity: 'high'
      });
    }

    // Check failed logins
    const failedLogins = this.securityEvents.filter(
      event => event.ip === ip && event.event === 'LOGIN_FAILED'
    ).length;

    if (failedLogins >= this.alertThresholds.failedLogins) {
      this.triggerAlert('BRUTE_FORCE_ATTEMPT', {
        ip,
        userId,
        count: failedLogins,
        threshold: this.alertThresholds.failedLogins,
        severity: 'high'
      });
    }

    // Check file upload abuse
    const fileUploadAbuse = this.securityEvents.filter(
      event => event.ip === ip && event.event === 'FILE_UPLOAD_ABUSE'
    ).length;

    if (fileUploadAbuse >= this.alertThresholds.fileUploadAttempts) {
      this.triggerAlert('FILE_UPLOAD_ABUSE', {
        ip,
        userId,
        count: fileUploadAbuse,
        threshold: this.alertThresholds.fileUploadAttempts,
        severity: 'medium'
      });
    }

    // Check socket abuse
    const socketEvents = this.securityEvents.filter(
      event => event.ip === ip && event.event.startsWith('SOCKET_')
    ).length;

    if (socketEvents >= this.alertThresholds.socketAbuse) {
      this.triggerAlert('SOCKET_ABUSE', {
        ip,
        userId,
        count: socketEvents,
        threshold: this.alertThresholds.socketAbuse,
        severity: 'medium'
      });
    }
  }

  // Trigger security alert
  triggerAlert(alertType, details) {
    const alert = {
      id: SecurityUtils.generateSecureString(16),
      timestamp: new Date().toISOString(),
      type: alertType,
      details,
      severity: details.severity || 'medium',
      actionRequired: details.severity === 'high'
    };

    console.log(`🚨 SECURITY ALERT [${alert.type}]:`, alert);

    // TODO: Send alert to external systems
    // - Email notifications
    // - Slack/Discord webhooks
    // - Security monitoring dashboards
    // - Admin panel notifications

    // For now, just log the alert
    this.logEvent('SECURITY_ALERT_TRIGGERED', {
      alertType,
      details,
      severity: 'high'
    });

    return alert;
  }

  // Check if IP is blocked
  isIPBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  // Check if user is suspicious
  isUserSuspicious(userId) {
    const userEvents = this.suspiciousUsers.get(userId) || [];
    const highThreatEvents = userEvents.filter(event => event.threatLevel === 'high');
    return highThreatEvents.length > 0;
  }

  // Get security statistics
  getSecurityStats() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentEvents = this.securityEvents.filter(
      event => new Date(event.timestamp) > last24Hours
    );

    const stats = {
      totalEvents: this.securityEvents.length,
      eventsLast24h: recentEvents.length,
      blockedIPs: this.blockedIPs.size,
      suspiciousUsers: this.suspiciousUsers.size,
      threatLevel: this.threatLevel,
      eventsBySeverity: {
        low: recentEvents.filter(e => e.severity === 'low').length,
        medium: recentEvents.filter(e => e.severity === 'medium').length,
        high: recentEvents.filter(e => e.severity === 'high').length
      },
      eventsByType: this.groupEventsByType(recentEvents),
      topThreatIPs: this.getTopThreatIPs(recentEvents),
      recentAlerts: this.getRecentAlerts()
    };

    return stats;
  }

  // Group events by type
  groupEventsByType(events) {
    const grouped = {};
    events.forEach(event => {
      if (!grouped[event.event]) {
        grouped[event.event] = 0;
      }
      grouped[event.event]++;
    });
    return grouped;
  }

  // Get top threat IPs
  getTopThreatIPs(events) {
    const ipThreats = {};
    events.forEach(event => {
      if (!ipThreats[event.ip]) {
        ipThreats[event.ip] = { count: 0, highThreats: 0 };
      }
      ipThreats[event.ip].count++;
      if (event.threatLevel === 'high') {
        ipThreats[event.ip].highThreats++;
      }
    });

    return Object.entries(ipThreats)
      .map(([ip, data]) => ({ ip, ...data }))
      .sort((a, b) => b.highThreats - a.highThreats || b.count - a.count)
      .slice(0, 10);
  }

  // Get recent alerts
  getRecentAlerts() {
    return this.securityEvents
      .filter(event => event.event === 'SECURITY_ALERT_TRIGGERED')
      .slice(-10)
      .reverse();
  }

  // Clear old events
  clearOldEvents(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    const cutoff = new Date(Date.now() - maxAge);
    this.securityEvents = this.securityEvents.filter(
      event => new Date(event.timestamp) > cutoff
    );
  }

  // Export security report
  generateSecurityReport() {
    const stats = this.getSecurityStats();
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalEvents: stats.totalEvents,
        threatLevel: stats.threatLevel,
        blockedIPs: stats.blockedIPs,
        suspiciousUsers: stats.suspiciousUsers
      },
      details: stats,
      recommendations: this.generateRecommendations(stats)
    };

    return report;
  }

  // Generate security recommendations
  generateRecommendations(stats) {
    const recommendations = [];

    if (stats.eventsBySeverity.high > 10) {
      recommendations.push({
        priority: 'high',
        action: 'Review and block high-threat IPs immediately',
        reason: 'High number of high-severity security events'
      });
    }

    if (stats.blockedIPs > 50) {
      recommendations.push({
        priority: 'medium',
        action: 'Consider implementing additional rate limiting',
        reason: 'Large number of blocked IPs indicates potential attack'
      });
    }

    if (stats.eventsByType.LOGIN_FAILED > 100) {
      recommendations.push({
        priority: 'high',
        action: 'Implement account lockout and CAPTCHA',
        reason: 'High number of failed login attempts'
      });
    }

    if (stats.eventsByType.FILE_UPLOAD_ABUSE > 20) {
      recommendations.push({
        priority: 'medium',
        action: 'Review file upload security and implement additional validation',
        reason: 'Multiple file upload abuse attempts detected'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'low',
        action: 'Continue monitoring - no immediate action required',
        reason: 'Security metrics within normal ranges'
      });
    }

    return recommendations;
  }

  // Reset security monitor (for testing)
  reset() {
    this.securityEvents = [];
    this.blockedIPs.clear();
    this.suspiciousUsers.clear();
    this.rateLimitViolations.clear();
    this.threatLevel = 'low';
  }
}

// Create singleton instance
const securityMonitor = new SecurityMonitor();

// Export the singleton instance
module.exports = securityMonitor;
