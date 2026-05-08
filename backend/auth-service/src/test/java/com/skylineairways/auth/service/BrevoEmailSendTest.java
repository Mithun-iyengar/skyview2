package com.skylineairways.auth.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/**
 * Manual test to verify Brevo email send works with the provided API key.
 * 
 * Set environment variables before running:
 * - EMAIL_BREVO_API_KEY=bskt794Fc5dZm6w
 * - EMAIL_BREVO_FROM=mnmiyengar@gmail.com
 * 
 * Run with: mvn test -Dtest=BrevoEmailSendTest -DforkMode=never
 */
@SpringBootTest
@TestPropertySource(properties = {
    "email.brevo.api-key=bskt794Fc5dZm6w",
    "email.brevo.from=mnmiyengar@gmail.com",
    "spring.mail.username=mnmiyengar@gmail.com"
})
public class BrevoEmailSendTest {

    @Autowired
    private AuthEmailService authEmailService;

    @Test
    public void testBrevoLoginEmailSend() {
        System.out.println("\n=== Testing Brevo Login Email Send ===");
        
        boolean sent = authEmailService.sendLoginNotificationEmail(
            "mnmiyengar@gmail.com",
            "Test User",
            "127.0.0.1",
            "Apr 30, 2026 02:30 PM"
        );
        
        System.out.println("Email sent: " + sent);
        if (!sent) {
            System.err.println("FAILED: Email was not sent. Check logs above for error details.");
        } else {
            System.out.println("SUCCESS: Login email sent via Brevo!");
        }
    }

    @Test
    public void testBrevoRegistrationEmailSend() {
        System.out.println("\n=== Testing Brevo Registration Email Send ===");
        
        boolean sent = authEmailService.sendRegistrationConfirmationEmail(
            "mnmiyengar@gmail.com",
            "Test User"
        );
        
        System.out.println("Email sent: " + sent);
        if (!sent) {
            System.err.println("FAILED: Email was not sent. Check logs above for error details.");
        } else {
            System.out.println("SUCCESS: Registration email sent via Brevo!");
        }
    }
}
