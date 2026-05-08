package com.skylineairways.booking.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "notification-service")
public interface NotificationServiceClient {

    @PostMapping("/notifications/booking-confirmation")
    void sendBookingConfirmation(@RequestParam String email, @RequestParam String bookingDetails);

    @PostMapping("/notifications/payment-success")
    void sendPaymentSuccess(@RequestParam String email, @RequestParam String paymentDetails);

    @PostMapping("/notifications/payment-failed")
    void sendPaymentFailed(@RequestParam String email, @RequestParam String paymentDetails);
}