package com.techtrove.rental.dto;

public class LoginResponse {
    private boolean success;
    private String token;

    public LoginResponse(String token) {
        this.token = token;
        this.success = true;
    }

    public LoginResponse(boolean success) {
        this.success = success;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
