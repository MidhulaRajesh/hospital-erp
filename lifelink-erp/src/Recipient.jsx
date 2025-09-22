import React, { useState } from "react";
import axios from "axios";
import "./Recipient.css";

const RecipientForm = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    dob: "",
    age: "",
    gender: "",
    contact_number: "",
    email: "",
    address: "",
    blood_group: "",
    required_organ: "",
    medical_condition: "",
    urgency_level: "Medium",
    last_checkup_date: "",
    hospital_name: "",
    hospital_location: "",
    emergency_contact_name: "",
    emergency_contact_relation: "",
    emergency_contact_number: ""
  });

  const [files, setFiles] = useState({
    id_proof: null,
    medical_reports: null
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
    if (files.id_proof) data.append("id_proof", files.id_proof);
    if (files.medical_reports) data.append("medical_reports", files.medical_reports);

    try {
      const res = await axios.post("http://localhost:5000/api/recipient", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Recipient Registered ✅");
      console.log(res.data);
    } catch (err) {
      console.error(err);
      alert("Error registering recipient ❌");
    }
  };

  return (
    <div className="recipient-form-container">
      <h2>Recipient Registration</h2>
      <form onSubmit={handleSubmit} className="recipient-form">
        <label>Full Name</label>
        <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required />

        <label>Date of Birth</label>
        <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />

        <label>Age</label>
        <input type="number" name="age" value={formData.age} onChange={handleChange} required />

        <label>Gender</label>
        <select name="gender" value={formData.gender} onChange={handleChange} required>
          <option value="">Select</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>

        <label>Contact Number</label>
        <input type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} required />

        <label>Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />

        <label>Address</label>
        <textarea name="address" value={formData.address} onChange={handleChange} required />

        <label>Blood Group</label>
        <input type="text" name="blood_group" value={formData.blood_group} onChange={handleChange} required />

        <label>Required Organ</label>
        <input type="text" name="required_organ" value={formData.required_organ} onChange={handleChange} required />

        <label>Urgency Level</label>
        <select name="urgency_level" value={formData.urgency_level} onChange={handleChange}>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>

        <label>Hospital Name</label>
        <input type="text" name="hospital_name" value={formData.hospital_name} onChange={handleChange} />

        <label>Hospital Location</label>
        <input type="text" name="hospital_location" value={formData.hospital_location} onChange={handleChange} />

        <label>Emergency Contact Name</label>
        <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} />

        <label>Emergency Contact Relation</label>
        <input type="text" name="emergency_contact_relation" value={formData.emergency_contact_relation} onChange={handleChange} />

        <label>Emergency Contact Number</label>
        <input type="text" name="emergency_contact_number" value={formData.emergency_contact_number} onChange={handleChange} />

        <label>ID Proof</label>
        <input type="file" name="id_proof" onChange={handleFileChange} />

        <label>Medical Reports</label>
        <input type="file" name="medical_reports" onChange={handleFileChange} />

        <button type="submit">Register Recipient</button>
      </form>
    </div>
  );
};

export default RecipientForm;
