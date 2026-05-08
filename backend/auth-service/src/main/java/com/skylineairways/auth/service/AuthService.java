package com.skylineairways.auth.service;

import java.time.Instant;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.skylineairways.auth.dto.AuthResponse;
import com.skylineairways.auth.dto.LoginRequest;
import com.skylineairways.auth.dto.RegisterRequest;
import com.skylineairways.auth.exception.BadRequestException;
import com.skylineairways.auth.exception.ResourceConflictException;
import com.skylineairways.auth.exception.UnauthorizedException;
import com.skylineairways.auth.model.User;
import com.skylineairways.auth.repository.UserRepository;
import com.skylineairways.auth.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Handles registration and login workflows.
 */
@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthEmailService authEmailService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, AuthEmailService authEmailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authEmailService = authEmailService;
    }

    public void register(RegisterRequest request) {
        String normalizedFullName = normalizeOptional(request.getFullName());
        String normalizedEmail = normalizeOptional(request.getEmail());
        String normalizedPhone = normalizeOptional(request.getPhone());

        validateAtLeastOneIdentifier(normalizedFullName, normalizedEmail, normalizedPhone);
        validateIdentifierUniqueness(normalizedFullName, normalizedEmail, normalizedPhone);

        User user = new User();
        user.setFullName(normalizedFullName);
        user.setEmail(normalizedEmail == null ? null : normalizedEmail.toLowerCase());
        user.setPhone(normalizedPhone);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setActive(true);
        user.setCreatedAt(Instant.now());

        userRepository.save(user);
        
        // Send registration confirmation email
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            logger.warn("Registration completed for user '{}' without email; confirmation email skipped", user.getFullName());
        } else {
            try {
                boolean emailSent = authEmailService.sendRegistrationConfirmationEmail(user.getEmail(), user.getFullName());
                if (!emailSent) {
                    logger.warn("Registration email was attempted but not delivered for {}", user.getEmail());
                }
            } catch (Exception e) {
                logger.error("Error sending registration email to: {}", user.getEmail(), e);
                // Continue processing even if email fails
            }
        }
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = normalizeOptional(request.getIdentifier());
        if (identifier == null) {
            throw new BadRequestException("identifier is required");
        }

        User user = findByIdentifier(identifier)
                .orElseThrow(() -> new UnauthorizedException("User not registered. Please register first."));

        if (!user.isActive()) {
            throw new UnauthorizedException("Account is inactive. Please contact support.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Incorrect password. Please try again.");
        }

        String token = jwtUtil.generateToken(user);
        
        // Send login notification email
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            logger.warn("Login succeeded for user '{}' but no email is stored; login notification email skipped", user.getFullName());
        } else {
            try {
                String ipAddress = "Unknown";  // Can be enhanced to extract from request headers
                String loginTime = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a"));
                boolean emailSent = authEmailService.sendLoginNotificationEmail(user.getEmail(), user.getFullName(), ipAddress, loginTime);
                if (!emailSent) {
                    logger.warn("Login email was attempted but not delivered for {}", user.getEmail());
                }
            } catch (Exception e) {
                logger.error("Error sending login notification email to: {}", user.getEmail(), e);
                // Continue processing even if email fails
            }
        }
        
        return new AuthResponse(token, user.getFullName());
    }

    private Optional<User> findByIdentifier(String identifier) {
        Optional<User> byEmail = userRepository.findByEmailIgnoreCase(identifier);
        if (byEmail.isPresent()) {
            return byEmail;
        }

        Optional<User> byPhone = userRepository.findByPhone(identifier);
        if (byPhone.isPresent()) {
            return byPhone;
        }

        return userRepository.findByFullNameIgnoreCase(identifier);
    }

    private void validateIdentifierUniqueness(String fullName, String email, String phone) {
        if (fullName != null && userRepository.existsByFullNameIgnoreCase(fullName)) {
            throw new ResourceConflictException("Full name already exists");
        }
        if (email != null && userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResourceConflictException("Email already exists");
        }
        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new ResourceConflictException("Phone already exists");
        }
    }

    private void validateAtLeastOneIdentifier(String fullName, String email, String phone) {
        if (fullName == null && email == null && phone == null) {
            throw new BadRequestException("At least one of fullName, email, or phone is required");
        }
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
