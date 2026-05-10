package com.skylineairways.notification.service;

import com.skylineairways.notification.model.Notification;
import com.skylineairways.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final JavaMailSender mailSender;

    public void sendBookingConfirmation(String recipientEmail, String bookingDetails) {
        String subject = "Skyline Airways - Booking Confirmation";
        String message = "Dear Customer,\n\nYour booking has been confirmed!\n\n" + bookingDetails +
                        "\n\nThank you for choosing Skyline Airways.\n\nBest regards,\nSkyline Airways Team";

        sendEmail(recipientEmail, subject, message, "BOOKING_CONFIRMATION");
    }

    public void sendPaymentSuccess(String recipientEmail, String paymentDetails) {
        String subject = "Skyline Airways - Payment Successful";
        String message = "Dear Customer,\n\nYour payment has been processed successfully!\n\n" + paymentDetails +
                        "\n\nThank you for your business.\n\nBest regards,\nSkyline Airways Team";

        sendEmail(recipientEmail, subject, message, "PAYMENT_SUCCESS");
    }

    public void sendPaymentFailed(String recipientEmail, String paymentDetails) {
        String subject = "Skyline Airways - Payment Failed";
        String message = "Dear Customer,\n\nUnfortunately, your payment could not be processed.\n\n" + paymentDetails +
                        "\n\nPlease try again or contact customer support.\n\nBest regards,\nSkyline Airways Team";

        sendEmail(recipientEmail, subject, message, "PAYMENT_FAILED");
    }

    public void sendBookingCancellation(String recipientEmail, String cancellationDetails) {
        String subject = "Skyline Airways - Booking Cancellation";
        String message = "Dear Customer,\n\nYour booking has been cancelled.\n\n" + cancellationDetails +
                        "\n\nIf you have any questions, please contact customer support.\n\nBest regards,\nSkyline Airways Team";

        sendEmail(recipientEmail, subject, message, "BOOKING_CANCELLATION");
    }

    private void sendEmail(String recipientEmail, String subject, String message, String type) {
        Notification notification = new Notification();
        notification.setRecipientEmail(recipientEmail);
        notification.setSubject(subject);
        notification.setMessage(message);
        notification.setType(type);
        notification.setCreatedAt(Instant.now());

        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setTo(recipientEmail);
            mailMessage.setSubject(subject);
            mailMessage.setText(message);

            mailSender.send(mailMessage);

            notification.setStatus("SENT");
            notification.setSentAt(Instant.now());
            log.info("Email sent successfully to {} for {}", recipientEmail, type);

        } catch (MailException e) {
            notification.setStatus("FAILED");
            notification.setErrorMessage(e.getMessage());
            log.error("Failed to send email to {}: {}", recipientEmail, e.getMessage());
        }

        notificationRepository.save(notification);
    }
}