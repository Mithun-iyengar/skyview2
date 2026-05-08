package com.skylineairways.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Login API request payload.
 */
public class LoginRequest {

    @NotBlank(message = "identifier is required")
    private String identifier;

    @NotBlank(message = "password is required")
    private String password;

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
