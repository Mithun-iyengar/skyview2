package com.skylineairways.auth.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.mail.internet.MimeMessage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthEmailServiceTest {

    @Mock private JavaMailSender mailSender;

    private AuthEmailService authEmailService;

    @BeforeEach
    void setUp() {
        authEmailService = new AuthEmailService();
        ReflectionTestUtils.setField(authEmailService, "mailSender", mailSender);
        ReflectionTestUtils.setField(authEmailService, "fromEmail", "no-reply@skylineairways.com");
    }

    @Test
    void sendRegistrationConfirmationEmailReturnsTrueWhenSMTPSucceeds() {
        MimeMessage mimeMessage = new JavaMailSenderImpl().createMimeMessage();
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        boolean sent = authEmailService.sendRegistrationConfirmationEmail("test@example.com", "Mithun");

        assertTrue(sent);
        verify(mailSender).send(mimeMessage);
    }

    @Test
    void sendRegistrationConfirmationEmailReturnsFalseForBlankRecipient() {
        assertFalse(authEmailService.sendRegistrationConfirmationEmail("   ", "Mithun"));
    }
}