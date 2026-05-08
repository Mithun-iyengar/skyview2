package com.skylineairways.auth.dto;

/**
 * Unified auth response payload.
 */
public class AuthResponse {

    private String token;
    private String name;

    public AuthResponse() {
    }

    public AuthResponse(String token, String name) {
        this.token = token;
        this.name = name;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
