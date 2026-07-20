package com.techtrove.rental.controller;

import com.techtrove.rental.config.JwtUtil;
import com.techtrove.rental.dto.ErrorResponse;
import com.techtrove.rental.dto.LoginRequest;
import com.techtrove.rental.dto.LoginResponse;
import com.techtrove.rental.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (authService.validatePassword(request.getPassword())) {
            String token = jwtUtil.generateToken("admin");
            return ResponseEntity.ok(new LoginResponse(token));
        }
        return ResponseEntity.status(401).body(new ErrorResponse("Invalid password"));
    }
}
