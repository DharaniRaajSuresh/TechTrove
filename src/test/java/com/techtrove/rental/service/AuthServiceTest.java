package com.techtrove.rental.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuthServiceTest {

    private static final String KNOWN_PASSWORD = "correct-password";

    private AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(KNOWN_PASSWORD);
    }

    @Test
    void validatePassword_correctPassword_returnsTrue() {
        assertTrue(service.validatePassword(KNOWN_PASSWORD));
    }

    @Test
    void validatePassword_wrongPassword_returnsFalse() {
        assertFalse(service.validatePassword("wrong-password"));
    }

    @Test
    void validatePassword_null_returnsFalse() {
        assertFalse(service.validatePassword(null));
    }

    @Test
    void validatePassword_emptyString_returnsFalse() {
        assertFalse(service.validatePassword(""));
    }
}
