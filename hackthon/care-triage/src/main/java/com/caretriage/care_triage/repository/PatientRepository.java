package com.caretriage.care_triage.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.caretriage.care_triage.entity.Patient;

public interface PatientRepository extends JpaRepository<Patient, Long> {
}