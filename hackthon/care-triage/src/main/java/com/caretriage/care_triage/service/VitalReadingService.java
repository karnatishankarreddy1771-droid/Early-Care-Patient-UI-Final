package com.caretriage.care_triage.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.caretriage.care_triage.entity.VitalReading;
import com.caretriage.care_triage.repository.VitalReadingRepository;

@Service
public class VitalReadingService {

    private final VitalReadingRepository vitalReadingRepository;

    public VitalReadingService(VitalReadingRepository vitalReadingRepository) {
        this.vitalReadingRepository = vitalReadingRepository;
    }

    public VitalReading createReading(VitalReading reading) {
        return vitalReadingRepository.save(reading);
    }

    public List<VitalReading> getAllReadings() {
        return vitalReadingRepository.findAll();
    }

    public VitalReading getReadingById(Long id) {
        return vitalReadingRepository.findById(id).orElse(null);
    }

    public List<VitalReading> getReadingsByPatient(Long patientId) {
        return vitalReadingRepository.findByPatientIdOrderByTimestampDesc(patientId);
    }

    public void deleteReading(Long id) {
        vitalReadingRepository.deleteById(id);
    }
}