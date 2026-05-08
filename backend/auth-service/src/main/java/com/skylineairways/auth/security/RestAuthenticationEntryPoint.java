package com.skylineairways.auth.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/**
 * Returns JSON for unauthenticated requests.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        // Do not send a WWW-Authenticate challenge; browsers show a basic-auth popup on 401.
        writeError(response, HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentication required", request.getRequestURI());
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String error, String message, String path)
            throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{"
                + "\"timestamp\":\"" + java.time.Instant.now() + "\"," 
                + "\"status\":" + status.value() + ","
                + "\"error\":\"" + escape(error) + "\"," 
                + "\"message\":\"" + escape(message) + "\"," 
                + "\"path\":\"" + escape(path) + "\""
                + "}");
    }

    private String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}