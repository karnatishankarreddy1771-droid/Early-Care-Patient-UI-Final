package com.caretriage.care_triage.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "vital_readings")
public class VitalReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId;

    private int heartRate;

    private int spo2;

    private int systolicBP;

    private int diastolicBP;

    private int respiratoryRate;

    private double temperature;

    private LocalDateTime timestamp;

    public VitalReading() {
    }

    public VitalReading(
            Long patientId,
            int heartRate,
            int spo2,
            int systolicBP,
            int diastolicBP,
            int respiratoryRate,
            double temperature
    ) {
        this.patientId = patientId;
        this.heartRate = heartRate;
        this.spo2 = spo2;
        this.systolicBP = systolicBP;
        this.diastolicBP = diastolicBP;
        this.respiratoryRate = respiratoryRate;
        this.temperature = temperature;
        this.timestamp = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public int getHeartRate() {
        return heartRate;
    }

    public void setHeartRate(int heartRate) {
        this.heartRate = heartRate;
    }

    public int getSpo2() {
        return spo2;
    }

    public void setSpo2(int spo2) {
        this.spo2 = spo2;
    }

    public int getSystolicBP() {
        return systolicBP;
    }

    public void setSystolicBP(int systolicBP) {
        this.systolicBP = systolicBP;
    }

    public int getDiastolicBP() {
        return diastolicBP;
    }

    public void setDiastolicBP(int diastolicBP) {
        this.diastolicBP = diastolicBP;
    }

    public int getRespiratoryRate() {
        return respiratoryRate;
    }

    public void setRespiratoryRate(int respiratoryRate) {
        this.respiratoryRate = respiratoryRate;
    }

    public double getTemperature() {
        return temperature;
    }

    public void setTemperature(double temperature) {
        this.temperature = temperature;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}