package com.skylineairways.auth.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

/**
 * Returns JSON for authenticated users without permission.
 */
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException)
            throws IOException {
        // Ensure no WWW-Authenticate header is present for forbidden responses
        response.setHeader("WWW-Authenticate", "");
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{"
                + "\"timestamp\":\"" + java.time.Instant.now() + "\"," 
                + "\"status\":" + HttpStatus.FORBIDDEN.value() + ","
                + "\"error\":\"Forbidden\"," 
                + "\"message\":\"Access denied\"," 
                + "\"path\":\"" + escape(request.getRequestURI()) + "\""
                + "}");
    }

    private String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}