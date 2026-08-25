package com.caretriage.care_triage.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.caretriage.care_triage.entity.VitalReading;

public interface VitalReadingRepository extends JpaRepository<VitalReading, Long> {

    List<VitalReading> findByPatientIdOrderByTimestampDesc(Long patientId);
}