package com.skylineairways.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.text.SimpleDateFormat;
import java.util.Date;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

@Service
public class AuthEmailService {

    private static final Logger logger = LoggerFactory.getLogger(AuthEmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${email.sendgrid.api-key:}")
    private String sendGridApiKey;

    @Value("${email.sendgrid.from:}")
    private String sendGridFrom;

    @Value("${email.resend.api-key:}")
    private String resendApiKey;

    @Value("${email.brevo.api-key:}")
    private String brevoApiKey;

    @Value("${email.brevo.from:}")
    private String brevoFrom;

    @Value("${email.mailjet.public:}")
    private String mailjetPublic;

    @Value("${email.mailjet.private:}")
    private String mailjetPrivate;

    @Value("${email.mailtrap.api-key:}")
    private String mailtrapApiKey;

    @Value("${email.http.trust-all-ssl:false}")
    private boolean trustAllSsl;

    private HttpClient httpClient() {
        if (!trustAllSsl) {
            return HttpClient.newHttpClient();
        }

        try {
            TrustManager[] trustAllManagers = new TrustManager[]{new X509TrustManager() {
                @Override
                public void checkClientTrusted(X509Certificate[] chain, String authType) {
                }

                @Override
                public void checkServerTrusted(X509Certificate[] chain, String authType) {
                }

                @Override
                public X509Certificate[] getAcceptedIssuers() {
                    return new X509Certificate[0];
                }
            }};

            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, trustAllManagers, new SecureRandom());

            SSLParameters sslParameters = new SSLParameters();
            sslParameters.setEndpointIdentificationAlgorithm(null);

            return HttpClient.newBuilder()
                    .sslContext(sslContext)
                    .sslParameters(sslParameters)
                    .build();
        } catch (Exception e) {
            logger.warn("Unable to create trust-all HTTP client, falling back to default client", e);
            return HttpClient.newHttpClient();
        }
    }

    public boolean sendRegistrationConfirmationEmail(String recipientEmail, String fullName) {
        String recipient = normalizeRecipient(recipientEmail);
        if (recipient == null) {
            logger.warn("No valid email provided for registration. Input: {}", recipientEmail);
            return false;
        }

        String subject = "Welcome to Skyline Airways - Registration Confirmed";
        String htmlContent = buildRegistrationEmailContent(fullName);
        return sendWithFallback(recipient, subject, htmlContent, "registration");
    }

    public boolean sendLoginNotificationEmail(String recipientEmail, String fullName, String ipAddress, String loginTime) {
        String recipient = normalizeRecipient(recipientEmail);
        if (recipient == null) {
            logger.warn("No valid email provided for login notification. Input: {}", recipientEmail);
            return false;
        }

        String subject = "Welcome back - Skyline Airways Login Alert";
        String htmlContent = buildLoginEmailContent(fullName, ipAddress, loginTime);
        return sendWithFallback(recipient, subject, htmlContent, "login");
    }

    private boolean sendWithFallback(String recipient, String subject, String htmlContent, String emailType) {
        if (trySendSmtp(recipient, subject, htmlContent)) {
            logger.info("{} email sent via SMTP to {}", emailType, recipient);
            return true;
        }

        if (trySendSendGrid(recipient, subject, htmlContent)) {
            logger.info("{} email sent via SendGrid API to {}", emailType, recipient);
            return true;
        }

        if (trySendResend(recipient, subject, htmlContent)) {
            logger.info("{} email sent via Resend API to {}", emailType, recipient);
            return true;
        }

        if (trySendBrevo(recipient, subject, htmlContent)) {
            logger.info("{} email sent via Brevo/Sendinblue API to {}", emailType, recipient);
            return true;
        }

        if (trySendMailjet(recipient, subject, htmlContent)) {
            logger.info("{} email sent via Mailjet API to {}", emailType, recipient);
            return true;
        }

        if (trySendMailtrap(recipient, subject, htmlContent)) {
            logger.info("{} email sent via Mailtrap API to {}", emailType, recipient);
            return true;
        }

        logger.error("Failed to send {} email to {}. All providers unavailable.", emailType, recipient);
        return false;
    }

    private boolean trySendSmtp(String recipient, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String senderEmail = fromEmail == null ? null : fromEmail.trim();
            if (senderEmail == null || senderEmail.isEmpty()) {
                logger.warn("SMTP sender email is not configured");
                return false;
            }

            helper.setFrom(senderEmail);
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(htmlContent == null ? "" : htmlContent, true);
            mailSender.send(message);
            return true;
        } catch (MessagingException e) {
            logger.warn("SMTP messaging error while sending email to {}", recipient, e);
            return false;
        } catch (Exception e) {
            logger.warn("SMTP transport error while sending email to {}", recipient, e);
            return false;
        }
    }

    private boolean trySendSendGrid(String recipient, String subject, String htmlContent) {
        String apiKey = sendGridApiKey == null ? "" : sendGridApiKey.trim();
        if (apiKey.isEmpty()) {
            return false;
        }

        String sender = (sendGridFrom != null && !sendGridFrom.trim().isEmpty())
                ? sendGridFrom.trim()
                : (fromEmail == null ? "" : fromEmail.trim());

        if (sender.isEmpty()) {
            logger.warn("SendGrid fallback configured but no sender email is available");
            return false;
        }

        try {
            String payload = "{"
                    + "\"personalizations\":[{\"to\":[{\"email\":\"" + escapeJson(recipient) + "\"}]}],"
                    + "\"from\":{\"email\":\"" + escapeJson(sender) + "\"},"
                    + "\"subject\":\"" + escapeJson(subject) + "\","
                    + "\"content\":[{\"type\":\"text/html\",\"value\":\"" + escapeJson(htmlContent == null ? "" : htmlContent) + "\"}]"
                    + "}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.sendgrid.com/v3/mail/send"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient().send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status >= 200 && status < 300) {
                return true;
            }

            logger.warn("SendGrid API failed with status {} and body: {}", status, response.body());
            return false;
        } catch (Exception e) {
            logger.warn("SendGrid API error while sending email to {}", recipient, e);
            return false;
        }
    }

    private boolean trySendResend(String recipient, String subject, String htmlContent) {
        String apiKey = resendApiKey == null ? "" : resendApiKey.trim();
        if (apiKey.isEmpty()) return false;

        try {
            String payload = "{"
                    + "\"from\":\"" + escapeJson(fromEmail) + "\"," 
                    + "\"to\":[\"" + escapeJson(recipient) + "\"],"
                    + "\"subject\":\"" + escapeJson(subject) + "\"," 
                    + "\"html\":\"" + escapeJson(htmlContent == null ? "" : htmlContent) + "\""
                    + "}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient().send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status >= 200 && status < 300) return true;
            logger.warn("Resend API failed with status {} and body: {}", status, response.body());
            return false;
        } catch (Exception e) {
            logger.warn("Resend API error while sending email to {}", recipient, e);
            return false;
        }
    }

    private boolean trySendBrevo(String recipient, String subject, String htmlContent) {
        String apiKey = brevoApiKey == null ? "" : brevoApiKey.trim();
        if (apiKey.isEmpty()) {
            logger.debug("Brevo API key not configured, skipping Brevo provider");
            return false;
        }

        try {
            String sender = brevoFrom == null ? "" : brevoFrom.trim();
            if (sender.isEmpty()) {
                sender = fromEmail == null ? "" : fromEmail.trim();
            }
            if (sender.isEmpty()) {
                logger.warn("Brevo fallback configured but no sender email is available");
                return false;
            }
            
            logger.debug("Attempting to send via Brevo. API Key length: {}, From: {}", apiKey.length(), sender);

            String payload = "{"
                    + "\"sender\":{\"email\":\"" + escapeJson(sender) + "\"},"
                    + "\"to\":[{\"email\":\"" + escapeJson(recipient) + "\"}],"
                    + "\"subject\":\"" + escapeJson(subject) + "\","
                    + "\"htmlContent\":\"" + escapeJson(htmlContent == null ? "" : htmlContent) + "\""
                    + "}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient().send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status >= 200 && status < 300) return true;
            logger.warn("Brevo API failed with status {} and body: {}", status, response.body());
            return false;
        } catch (Exception e) {
            logger.warn("Brevo API error while sending email to {}", recipient, e);
            return false;
        }
    }

    private boolean trySendMailjet(String recipient, String subject, String htmlContent) {
        String pub = mailjetPublic == null ? "" : mailjetPublic.trim();
        String priv = mailjetPrivate == null ? "" : mailjetPrivate.trim();
        if (pub.isEmpty() || priv.isEmpty()) return false;

        try {
            String sender = fromEmail == null ? "" : fromEmail.trim();
            if (sender.isEmpty()) {
                logger.warn("Mailjet fallback configured but no sender email is available");
                return false;
            }

            String payload = "{\"Messages\":[{\"From\":{\"Email\":\"" + escapeJson(sender) + "\"},\"To\":[{\"Email\":\"" + escapeJson(recipient) + "\"}],\"Subject\":\"" + escapeJson(subject) + "\",\"HTMLPart\":\"" + escapeJson(htmlContent == null ? "" : htmlContent) + "\"}]}";

            String auth = java.util.Base64.getEncoder().encodeToString((pub + ":" + priv).getBytes());

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.mailjet.com/v3.1/send"))
                    .header("Authorization", "Basic " + auth)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient().send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status >= 200 && status < 300) return true;
            logger.warn("Mailjet API failed with status {} and body: {}", status, response.body());
            return false;
        } catch (Exception e) {
            logger.warn("Mailjet API error while sending email to {}", recipient, e);
            return false;
        }
    }

    private boolean trySendMailtrap(String recipient, String subject, String htmlContent) {
        String apiKey = mailtrapApiKey == null ? "" : mailtrapApiKey.trim();
        if (apiKey.isEmpty()) return false;

        try {
            String sender = fromEmail == null ? "" : fromEmail.trim();
            if (sender.isEmpty()) {
                logger.warn("Mailtrap fallback configured but no sender email is available");
                return false;
            }

            String payload = "{"
                    + "\"from\":{\"email\":\"" + escapeJson(sender) + "\"},"
                    + "\"to\":[{\"email\":\"" + escapeJson(recipient) + "\"}],"
                    + "\"subject\":\"" + escapeJson(subject) + "\","
                    + "\"html\":\"" + escapeJson(htmlContent == null ? "" : htmlContent) + "\""
                    + "}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://send.api.mailtrap.io/api/send"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient().send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status >= 200 && status < 300) return true;
            logger.warn("Mailtrap API failed with status {} and body: {}", status, response.body());
            return false;
        } catch (Exception e) {
            logger.warn("Mailtrap API error while sending email to {}", recipient, e);
            return false;
        }
    }

    private String normalizeRecipient(String recipientEmail) {
        if (recipientEmail == null) {
            return null;
        }
        String recipient = recipientEmail.trim().toLowerCase();
        return recipient.isEmpty() ? null : recipient;
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "")
                .replace("\n", "\\n");
    }

    private String buildRegistrationEmailContent(String fullName) {
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
        html.append("        .welcome-section { background: #F8F9FF; border-left: 4px solid #2D63C4; padding: 24px; border-radius: 8px; margin-bottom: 30px; }");
        html.append("        .welcome-section h3 { color: #1F4DA0; margin-top: 0; font-size: 18px; }");
        html.append("        .welcome-section p { color: #666; line-height: 1.8; margin: 10px 0; }");
        html.append("        .benefits { margin: 30px 0; }");
        html.append("        .benefits h3 { color: #1F4DA0; font-size: 18px; margin-bottom: 20px; }");
        html.append("        .benefit-item { background: #F5F5F5; padding: 16px; margin-bottom: 12px; border-radius: 8px; display: flex; gap: 12px; }");
        html.append("        .benefit-icon { font-size: 24px; }");
        html.append("        .benefit-text { color: #666; }");
        html.append("        .cta-button { display: inline-block; background: linear-gradient(135deg, #1F4DA0 0%, #2D63C4 100%); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; margin-top: 20px; font-weight: 600; }");
        html.append("        .footer { background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #ddd; color: #666; font-size: 12px; }");
        html.append("    </style>");
        html.append("</head>");
        html.append("<body>");

        html.append("<div class='email-container'>");
        html.append("    <div class='header'>");
        html.append("        <h1>🎉 Welcome to Skyline Airways!</h1>");
        html.append("        <p>Your account has been successfully created</p>");
        html.append("    </div>");

        html.append("    <div class='content'>");
        html.append("        <div class='welcome-section'>");
        html.append("            <h3>Hello ").append(fullName != null ? fullName : "Traveler").append("! 👋</h3>");
        html.append("            <p>Thank you for joining Skyline Airways! Your account is now active and ready to use.</p>");
        html.append("            <p>We're excited to have you on board. Start booking your flights and enjoy amazing travel experiences with us!</p>");
        html.append("        </div>");

        html.append("        <div class='benefits'>");
        html.append("            <h3>🎁 What You Can Do Now</h3>");
        html.append("            <div class='benefit-item'>");
        html.append("                <div class='benefit-icon'>✈️</div>");
        html.append("                <div class='benefit-text'><strong>Book Flights</strong> - Search and book flights to destinations worldwide</div>");
        html.append("            </div>");
        html.append("            <div class='benefit-item'>");
        html.append("                <div class='benefit-icon'>💺</div>");
        html.append("                <div class='benefit-text'><strong>Select Seats</strong> - Choose your preferred seats (Economy, Business)</div>");
        html.append("            </div>");
        html.append("            <div class='benefit-item'>");
        html.append("                <div class='benefit-icon'>🍽️</div>");
        html.append("                <div class='benefit-text'><strong>Meal Options</strong> - Choose your meal preferences</div>");
        html.append("            </div>");
        html.append("            <div class='benefit-item'>");
        html.append("                <div class='benefit-icon'>🎫</div>");
        html.append("                <div class='benefit-text'><strong>Online Check-in</strong> - Check in 24 hours before flight</div>");
        html.append("            </div>");
        html.append("            <div class='benefit-item'>");
        html.append("                <div class='benefit-icon'>🏆</div>");
        html.append("                <div class='benefit-text'><strong>Rewards Program</strong> - Earn miles on every booking</div>");
        html.append("            </div>");
        html.append("        </div>");

        html.append("        <p style='color: #666; text-align: center; margin-top: 30px;'>");
        html.append("            <a class='cta-button' href='http://localhost:3000'>Start Booking Now</a>");
        html.append("        </p>");

        html.append("        <div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 13px; color: #999;'>");
        html.append("            <p style='margin: 0;'><strong>Account Security:</strong></p>");
        html.append("            <ul style='color: #999; margin: 10px 0; padding-left: 20px;'>");
        html.append("                <li>Keep your password secure and never share it</li>");
        html.append("                <li>Use a strong password with numbers and special characters</li>");
        html.append("                <li>Logout from public computers after your session</li>");
        html.append("            </ul>");
        html.append("        </div>");

        html.append("    </div>");

        html.append("    <div class='footer'>");
        html.append("        <p>Thank you for choosing Skyline Airways! ✈️</p>");
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

    private String buildLoginEmailContent(String fullName, String ipAddress, String loginTime) {
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
        html.append("        .content { padding: 40px; }");
        html.append("        .alert-box { background: #FFF8DC; border-left: 4px solid #D4AF37; padding: 20px; border-radius: 8px; margin-bottom: 30px; }");
        html.append("        .alert-box h3 { color: #1F4DA0; margin-top: 0; font-size: 18px; }");
        html.append("        .detail-box { background: #F8F9FF; border: 1px solid #E8E8E8; padding: 20px; border-radius: 8px; margin: 20px 0; }");
        html.append("        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E8E8E8; }");
        html.append("        .detail-row:last-child { border-bottom: none; }");
        html.append("        .detail-label { color: #666; font-weight: 600; }");
        html.append("        .detail-value { color: #1F4DA0; font-weight: 700; }");
        html.append("        .security-tips { background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 20px; border-radius: 8px; margin-top: 30px; }");
        html.append("        .security-tips h4 { color: #2E7D32; margin-top: 0; }");
        html.append("        .security-tips ul { color: #2E7D32; margin: 10px 0; padding-left: 20px; }");
        html.append("        .footer { background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #ddd; color: #666; font-size: 12px; }");
        html.append("    </style>");
        html.append("</head>");
        html.append("<body>");

        html.append("<div class='email-container'>");
        html.append("    <div class='header'>");
        html.append("        <h1>🔐 Login Alert</h1>");
        html.append("        <p>We detected a successful login to your Skyline Airways account</p>");
        html.append("    </div>");

        html.append("    <div class='content'>");
        html.append("        <p style='color: #333;'>Hello ").append(fullName != null ? fullName : "User").append(",</p>");
        html.append("        <p style='color: #666; line-height: 1.8;'>");
        html.append("            A successful login to your Skyline Airways account was detected. ");
        html.append("            Below are the details of your login:").append("        </p>");

        html.append("        <div class='detail-box'>");
        html.append("            <div class='detail-row'>");
        html.append("                <span class='detail-label'>📅 Login Time</span>");
        html.append("                <span class='detail-value'>").append(loginTime != null ? loginTime : "Just now").append("</span>");
        html.append("            </div>");
        html.append("            <div class='detail-row'>");
        html.append("                <span class='detail-label'>🌐 IP Address</span>");
        html.append("                <span class='detail-value'>").append(ipAddress != null ? ipAddress : "Unknown").append("</span>");
        html.append("            </div>");
        html.append("            <div class='detail-row'>");
        html.append("                <span class='detail-label'>📱 Device</span>");
        html.append("                <span class='detail-value'>Web Browser</span>");
        html.append("            </div>");
        html.append("        </div>");

        html.append("        <div class='alert-box'>");
        html.append("            <h3>⚠️ Important</h3>");
        html.append("            <p style='color: #333; margin: 0;'>");
        html.append("                <strong>If this wasn't you,</strong> click the button below to secure your account immediately:");
        html.append("            </p>");
        html.append("        </div>");

        html.append("        <div style='text-align: center; margin: 30px 0;'>");
        html.append("            <a href='http://localhost:3000/secure-account' style='display: inline-block; background: #DC3545; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;'>Secure Your Account</a>");
        html.append("        </div>");

        html.append("        <div class='security-tips'>");
        html.append("            <h4>🛡️ Security Tips</h4>");
        html.append("            <ul>");
        html.append("                <li>Review this login activity - is it you?</li>");
        html.append("                <li>Never share your password with anyone</li>");
        html.append("                <li>Use a strong, unique password</li>");
        html.append("                <li>Enable two-factor authentication if available</li>");
        html.append("                <li>Check your account activity regularly</li>");
        html.append("            </ul>");
        html.append("        </div>");

        html.append("    </div>");

        html.append("    <div class='footer'>");
        html.append("        <p>Thank you for using Skyline Airways! ✈️</p>");
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
