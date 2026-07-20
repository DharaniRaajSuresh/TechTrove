package com.techtrove.rental.service;

import com.techtrove.rental.model.AuditLog;
import com.techtrove.rental.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepo;

    public void log(String action, String entityType, String entityId, String details) {
        auditLogRepo.save(new AuditLog(action, entityType, entityId, details));
    }
}
