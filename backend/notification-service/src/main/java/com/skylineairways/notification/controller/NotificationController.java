package com.skylineairways.notification.controller;

import com.skylineairways.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/booking-confirmation")
    public ResponseEntity<String> sendBookingConfirmation(@RequestParam String email, @RequestParam String bookingDetails) {
        log.info("Sending booking confirmation to {}", email);
        notificationService.sendBookingConfirmation(email, bookingDetails);
        return ResponseEntity.ok("Booking confirmation sent");
    }

    @PostMapping("/payment-success")
    public ResponseEntity<String> sendPaymentSuccess(@RequestParam String email, @RequestParam String paymentDetails) {
        log.info("Sending payment success notification to {}", email);
        notificationService.sendPaymentSuccess(email, paymentDetails);
        return ResponseEntity.ok("Payment success notification sent");
    }

    @PostMapping("/payment-failed")
    public ResponseEntity<String> sendPaymentFailed(@RequestParam String email, @RequestParam String paymentDetails) {
        log.info("Sending payment failed notification to {}", email);
        notificationService.sendPaymentFailed(email, paymentDetails);
        return ResponseEntity.ok("Payment failed notification sent");
    }

    @PostMapping("/booking-cancellation")
    public ResponseEntity<String> sendBookingCancellation(@RequestParam String email, @RequestParam String cancellationDetails) {
        log.info("Sending booking cancellation notification to {}", email);
        notificationService.sendBookingCancellation(email, cancellationDetails);
        return ResponseEntity.ok("Booking cancellation notification sent");
    }
}