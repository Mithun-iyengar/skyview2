package com.skylineairways.booking.service;

import com.skylineairways.booking.dto.BookingResponseDto;
import com.skylineairways.booking.dto.PassengerDetailDto;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.text.SimpleDateFormat;
import java.util.Date;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendBookingConfirmationEmail(BookingResponseDto booking) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String recipientEmail = booking.getPassengerEmail();
            if (recipientEmail == null || recipientEmail.isEmpty()) {
                logger.warn("No email provided for booking ID: {}", booking.getId());
                return;
            }

            String senderEmail = fromEmail;
            if (senderEmail == null || senderEmail.isEmpty()) {
                logger.error("Mail sender email not configured");
                return;
            }

            helper.setFrom(senderEmail);
            helper.setTo(recipientEmail);
            helper.setSubject("✈️ Your Flight Booking Confirmation - " + booking.getFlightId());

            String htmlContent = buildEmailContent(booking);
            if (htmlContent != null) {
                helper.setText(htmlContent, true);
            }

            mailSender.send(message);
            logger.info("Confirmation email sent successfully to: {}", recipientEmail);
        } catch (MessagingException e) {
            logger.error("Error sending confirmation email for booking ID: {}", booking.getId(), e);
        } catch (Exception e) {
            logger.error("Unexpected error while sending email", e);
        }
    }

    private String buildEmailContent(BookingResponseDto booking) {
        StringBuilder html = new StringBuilder();

        html.append("<!DOCTYPE html>");
        html.append("<html lang='en'>");
        html.append("<head>");
        html.append("    <meta charset='UTF-8'>");
        html.append("    <meta name='viewport' content='width=device-width, initial-scale=1.0'>");
        html.append("    <style>");
        html.append("        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }");
        html.append("        .email-container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }");
        html.append("        .header { background: linear-gradient(135deg, #1F4DA0 0%, #2D63C4 100%); color: white; padding: 40px; text-align: center; }");
        html.append("        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }");
        html.append("        .header p { opacity: 0.9; margin: 10px 0 0 0; }");
        html.append("        .content { padding: 40px; }");
        html.append("        .section { margin-bottom: 30px; }");
        html.append("        .section h3 { color: #1F4DA0; font-size: 18px; font-weight: 700; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; margin-bottom: 20px; }");
        html.append("        .flight-details { background: #F8F9FF; border-left: 4px solid #2D63C4; padding: 20px; border-radius: 8px; margin-bottom: 20px; }");
        html.append("        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }");
        html.append("        .detail-label { font-weight: 600; color: #333; }");
        html.append("        .detail-value { color: #1F4DA0; font-weight: 700; }");
        html.append("        .passenger-card { background: #F5F5F5; border-left: 4px solid #D4AF37; padding: 16px; margin-bottom: 15px; border-radius: 8px; }");
        html.append("        .passenger-name { font-weight: 700; color: #1F4DA0; font-size: 16px; margin-bottom: 8px; }");
        html.append("        .passenger-info { color: #666; font-size: 14px; }");
        html.append("        .highlight-box { background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(45,99,196,0.05) 100%); border: 2px solid #D4AF37; padding: 20px; border-radius: 8px; margin: 20px 0; }");
        html.append("        .highlight-box .label { color: #D4AF37; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }");
        html.append("        .highlight-box .value { color: #1F4DA0; font-size: 24px; font-weight: 900; margin-top: 8px; }");
        html.append("        .checkin-section { background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 20px; border-radius: 8px; }");
        html.append("        .checkin-section h4 { color: #2E7D32; margin-top: 0; }");
        html.append("        .footer { background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #ddd; color: #666; font-size: 12px; }");
        html.append("        .btn { display: inline-block; background: linear-gradient(135deg, #1F4DA0 0%, #2D63C4 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; margin-top: 20px; font-weight: 600; }");
        html.append("    </style>");
        html.append("</head>");
        html.append("<body>");

        // Header
        html.append("<div class='email-container'>");
        html.append("    <div class='header'>");
        html.append("        <h1>✈️ Booking Confirmed!</h1>");
        html.append("        <p>Your flight is booked and ready</p>");
        html.append("    </div>");

        // Content
        html.append("    <div class='content'>");

        // Flight Details Section
        html.append("        <div class='section'>");
        html.append("            <h3>Flight Details</h3>");
        html.append("            <div class='flight-details'>");
        html.append("                <div class='detail-row'>");
        html.append("                    <span class='detail-label'>Flight Number</span>");
        html.append("                    <span class='detail-value'>").append(booking.getFlightId()).append("</span>");
        html.append("                </div>");
        html.append("                <div class='detail-row'>");
        html.append("                    <span class='detail-label'>Booking ID</span>");
        html.append("                    <span class='detail-value'>").append(booking.getId()).append("</span>");
        html.append("                </div>");
        html.append("                <div class='detail-row'>");
        html.append("                    <span class='detail-label'>Selected Seats</span>");
        html.append("                    <span class='detail-value'>").append(String.join(", ", booking.getSeatNumbers())).append("</span>");
        html.append("                </div>");
        html.append("            </div>");
        html.append("        </div>");

        // Passengers Section
        html.append("        <div class='section'>");
        html.append("            <h3>👤 Passenger Information</h3>");
        html.append("            <div class='passenger-card'>");
        html.append("                <div class='passenger-name'>Primary: ").append(booking.getPassengerName()).append("</div>");
        html.append("                <div class='passenger-info'>Age: ").append(booking.getPassengerAge()).append(" years</div>");
        html.append("                <div class='passenger-info'>Email: ").append(booking.getPassengerEmail()).append("</div>");
        html.append("                <div class='passenger-info'>Phone: ").append(booking.getPassengerPhone()).append("</div>");
        html.append("                <div class='passenger-info'>🍽️ Meal Preference: <strong>").append(booking.getMealPreference()).append("</strong></div>");
        if (booking.getWheelchairAssistance()) {
            html.append("                <div class='passenger-info'>♿ Wheelchair Assistance: Required</div>");
        }
        html.append("            </div>");

        // Co-passengers
        if (booking.getAdditionalPassengers() != null && !booking.getAdditionalPassengers().isEmpty()) {
            html.append("            <h4 style='color: #1F4DA0; margin-top: 20px;'>Co-Passengers</h4>");
            int count = 1;
            for (PassengerDetailDto passenger : booking.getAdditionalPassengers()) {
                html.append("            <div class='passenger-card'>");
                html.append("                <div class='passenger-name'>Passenger ").append(count).append(": ").append(passenger.getFullName()).append("</div>");
                html.append("                <div class='passenger-info'>Age: ").append(passenger.getAge()).append(" years</div>");
                if (passenger.getEmail() != null && !passenger.getEmail().isBlank()) {
                    html.append("                <div class='passenger-info'>Email: ").append(passenger.getEmail()).append("</div>");
                }
                if (passenger.getPhone() != null && !passenger.getPhone().isBlank()) {
                    html.append("                <div class='passenger-info'>Phone: ").append(passenger.getPhone()).append("</div>");
                }
                html.append("                <div class='passenger-info'>🍽️ Meal Preference: <strong>").append(passenger.getMealPreference()).append("</strong></div>");
                html.append("            </div>");
                count++;
            }
        }
        html.append("        </div>");

        // Pricing Section
        html.append("        <div class='highlight-box'>");
        html.append("            <div class='label'>Total Amount Payable</div>");
        html.append("            <div class='value'>₹").append(booking.getTotalAmount()).append("</div>");
        html.append("        </div>");

        // Check-in Section
        html.append("        <div class='checkin-section'>");
        html.append("            <h4>✅ Online Check-in Available</h4>");
        html.append("            <p>Check in 24 hours before your flight departure. Click the button below to check in now:</p>");
        html.append("            <a class='btn' href='http://localhost:3000/check-in?bookingId=").append(booking.getId()).append("'>Check In Now</a>");
        html.append("        </div>");

        // Important Info
        html.append("        <div class='section'>");
        html.append("            <h3>Important Information</h3>");
        html.append("            <ul style='color: #666; line-height: 1.8;'>");
        html.append("                <li>Please arrive at the airport at least <strong>2 hours</strong> before departure</li>");
        html.append("                <li>Carry valid ID proof and booking confirmation</li>");
        html.append("                <li>Baggage allowance: 20kg per passenger</li>");
        html.append("                <li>Cabin baggage allowed: 7kg per passenger</li>");
        html.append("                <li>For any queries, contact support@skylineairways.com</li>");
        html.append("            </ul>");
        html.append("        </div>");

        html.append("    </div>");

        // Footer
        html.append("    <div class='footer'>");
        html.append("        <p>Thank you for choosing Skyline Airways! ✈️</p>");
        html.append("        <p>Booking Confirmation ID: <strong>").append(booking.getId()).append("</strong></p>");
        html.append("        <p style='margin-top: 15px; border-top: 1px solid #ddd; padding-top: 15px;'>");
        html.append("            Skyline Airways | support@skylineairways.com | 1800-SKYLINE<br>");
        html.append("            ").append(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
        html.append("        </p>");
        html.append("    </div>");
        html.append("</div>");
        html.append("</body>");
        html.append("</html>");

        return html.toString();
    }
}
