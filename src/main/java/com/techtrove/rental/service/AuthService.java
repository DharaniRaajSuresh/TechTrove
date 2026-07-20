package com.techtrove.rental.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final BCryptPasswordEncoder passwordEncoder;
    private final String encodedPassword;

    public AuthService(@Value("${app.password}") String rawPassword) {
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.encodedPassword = passwordEncoder.encode(rawPassword);
    }

    public boolean validatePassword(String password) {
        if (password == null) return false;
        return passwordEncoder.matches(password, encodedPassword);
    }
}
