package com.techtrove.rental.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techtrove.rental.dto.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Order(0)
public class RateLimitingFilter extends OncePerRequestFilter {

    private final ConcurrentHashMap<String, AtomicInteger> requestCounts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> blockTimes = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> resetScheduled = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    private static final int MAX_REQUESTS = 20;
    private static final long WINDOW_MS = 60_000;
    private static final long BLOCK_DURATION_MS = 300_000;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        if (!path.equals("/api/auth/login")) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = request.getRemoteAddr();
        long now = System.currentTimeMillis();

        Long blockUntil = blockTimes.get(ip);
        if (blockUntil != null && now < blockUntil) {
            sendTooMany(response);
            return;
        } else if (blockUntil != null) {
            blockTimes.remove(ip);
            requestCounts.remove(ip);
            resetScheduled.remove(ip);
        }

        AtomicInteger counter = requestCounts.computeIfAbsent(ip, k -> new AtomicInteger(0));
        int count = counter.incrementAndGet();

        if (count == 1 && resetScheduled.putIfAbsent(ip, now) == null) {
            scheduleReset(ip);
        }

        if (count > MAX_REQUESTS) {
            blockTimes.put(ip, now + BLOCK_DURATION_MS);
            requestCounts.remove(ip);
            resetScheduled.remove(ip);
            sendTooMany(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void scheduleReset(String ip) {
        scheduler.schedule(() -> {
            AtomicInteger counter = requestCounts.get(ip);
            if (counter != null) {
                counter.set(0);
            }
            resetScheduled.remove(ip);
        }, WINDOW_MS, TimeUnit.MILLISECONDS);
    }

    private void sendTooMany(HttpServletResponse response) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json");
        response.getWriter().write(objectMapper.writeValueAsString(new ErrorResponse("Too many requests. Try again in 5 minutes.")));
    }
}
