package com.skylineairways.booking.client;

import com.skylineairways.booking.dto.PaymentResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "payment-service", url = "${services.payment.url:http://localhost:8084}")
public interface PaymentServiceClient {

    @PostMapping("/payments/process")
    PaymentResponse processPayment(@RequestBody Map<String, Object> paymentRequest);
}