package com.caretriage.care_triage.controller;

import com.caretriage.care_triage.entity.VitalReading;
import com.caretriage.care_triage.service.VitalReadingService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vitals")
@CrossOrigin
public class VitalReadingController {

    private final VitalReadingService vitalReadingService;

    public VitalReadingController(VitalReadingService vitalReadingService) {
        this.vitalReadingService = vitalReadingService;
    }

    @PostMapping
    public VitalReading createReading(@RequestBody VitalReading reading) {
        return vitalReadingService.createReading(reading);
    }

    @GetMapping
    public List<VitalReading> getAllReadings() {
        return vitalReadingService.getAllReadings();
    }

    @GetMapping("/{id}")
    public VitalReading getReadingById(@PathVariable Long id) {
        return vitalReadingService.getReadingById(id);
    }

    @GetMapping("/patient/{patientId}")
    public List<VitalReading> getReadingsByPatient(
            @PathVariable Long patientId) {

        return vitalReadingService.getReadingsByPatient(patientId);
    }

    @DeleteMapping("/{id}")
    public String deleteReading(@PathVariable Long id) {

        vitalReadingService.deleteReading(id);

        return "Vital reading deleted successfully";
    }
}