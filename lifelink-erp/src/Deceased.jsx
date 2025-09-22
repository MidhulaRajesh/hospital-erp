import React, { useState } from "react";
import axios from "axios";
import "./Deceased.css";

const DeceasedDonorForm = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    age_at_death: "",
    gender: "",
    date_of_death: "",
    time_of_death: "",
    cause_of_death: "",
    address: "",
    blood_group: "",
    organs_eligible: "",
    hospital_name: "",
    hospital_location: "",
    national_id: "",
    next_of_kin_name: "",
    next_of_kin_relation: "",
    next_of_kin_contact: ""
  });

  const [files, setFiles] = useState({
    medical_reports: null,
    death_certificate: null,
    brain_death_form: null,
    family_consent_form: null
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    Object.keys(files).forEach((key) => {
      if (files[key]) data.append(key, files[key]);
    });

    try {
      const res = await axios.post("http://localhost:5000/api/deceased-donor", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Deceased Donor Registered ✅");
      console.log(res.data);
    } catch (err) {
      console.error(err);
      alert("Error registering donor ❌");
    }
  };

  return (
    <div className="donor-form-container">
      <h2>Deceased Donor Registration</h2>
      <form onSubmit={handleSubmit} className="donor-form">
        <label>Full Name</label>
        <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required />

        <label>Age at Death</label>
        <input type="number" name="age_at_death" value={formData.age_at_death} onChange={handleChange} required />

        <label>Gender</label>
        <select name="gender" value={formData.gender} onChange={handleChange} required>
          <option value="">Select</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>

        <label>Date of Death</label>
        <input type="date" name="date_of_death" value={formData.date_of_death} onChange={handleChange} required />

        <label>Time of Death</label>
        <input type="time" name="time_of_death" value={formData.time_of_death} onChange={handleChange} required />

        <label>Cause of Death</label>
        <input type="text" name="cause_of_death" value={formData.cause_of_death} onChange={handleChange} required />

        <label>Address</label>
        <textarea name="address" value={formData.address} onChange={handleChange} required />

        <label>Blood Group</label>
        <input type="text" name="blood_group" value={formData.blood_group} onChange={handleChange} required />

        <label>Organs Eligible</label>
        <input type="text" name="organs_eligible" value={formData.organs_eligible} onChange={handleChange} required />

        <label>Hospital Name</label>
        <input type="text" name="hospital_name" value={formData.hospital_name} onChange={handleChange} />

        <label>Hospital Location</label>
        <input type="text" name="hospital_location" value={formData.hospital_location} onChange={handleChange} />

        <label>National ID</label>
        <input type="text" name="national_id" value={formData.national_id} onChange={handleChange} required />

        <label>Next of Kin Name</label>
        <input type="text" name="next_of_kin_name" value={formData.next_of_kin_name} onChange={handleChange} />

        <label>Next of Kin Relation</label>
        <input type="text" name="next_of_kin_relation" value={formData.next_of_kin_relation} onChange={handleChange} />

        <label>Next of Kin Contact</label>
        <input type="text" name="next_of_kin_contact" value={formData.next_of_kin_contact} onChange={handleChange} />

        <label>Medical Reports</label>
        <input type="file" name="medical_reports" onChange={handleFileChange} />

        <label>Death Certificate</label>
        <input type="file" name="death_certificate" onChange={handleFileChange} />

        <label>Brain Death Form</label>
        <input type="file" name="brain_death_form" onChange={handleFileChange} />

        <label>Family Consent Form</label>
        <input type="file" name="family_consent_form" onChange={handleFileChange} />

        <button type="submit">Register Donor</button>
      </form>
    </div>
  );
};

export default DeceasedDonorForm;
