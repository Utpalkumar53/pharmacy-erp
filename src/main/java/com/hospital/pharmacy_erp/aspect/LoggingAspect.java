package com.hospital.pharmacy_erp.aspect;

import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.service.AuditService;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class LoggingAspect {

    @Autowired
    private AuditService auditService;

    @AfterReturning(pointcut = "execution(* com.hospital.pharmacy_erp.service.MedicineService.saveMedicine(..)) || " +
                               "execution(* com.hospital.pharmacy_erp.service.SupplierService.saveSupplier(..))", returning = "result")
    public void logMedicineAction(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().getName();
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (result instanceof Medicine medicine) {
            String medicineName = medicine.getName();
            auditService.log(username, "INVENTORY_ACTION", "Successfully processed medicine: " + medicineName);
        }
    }
}
