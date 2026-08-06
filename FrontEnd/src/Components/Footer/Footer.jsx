import React from "react";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";

import  './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Selfme.lk</h3>
          <p>
            Leading solar energy solutions provider in Sri Lanka, committed to
            sustainable and affordable renewable energy.
          </p>
          <div className="social-icons">
            <a href="#">
              <FaFacebook />
            </a>
            <a href="#">
              <FaTwitter />
            </a>
            <a href="#">
              <FaInstagram />
            </a>
            <a href="#">
              <FaLinkedin />
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <a href="#">Home</a>
            </li>
            <li>
              <a href="#">About Us</a>
            </li>
            <li>
              <a href="#">Services</a>
            </li>
            <li>
              <a href="#">Products</a>
            </li>
            <li>
              <a href="#">Contact</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Services</h4>
          <ul>
            <li>
              <a href="#">Residential Solar</a>
            </li>
            <li>
              <a href="#">Commercial Solar</a>
            </li>
            <li>
              <a href="#">Solar Maintenance</a>
            </li>
            <li>
              <a href="#">Energy Audits</a>
            </li>
            <li>
              <a href="#">System Upgrades</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact Us</h4>
          <div className="contact-info">
            <p>
              <FaMapMarkerAlt /> 123 Solar Street, Colombo, Sri Lanka
            </p>
            <p>
              <FaPhone /> +94 112 345 678
            </p>
            <p>
              <FaEnvelope /> info@selfme.lk
            </p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Selfme.lk. All Rights Reserved.</p>
        <div className="legal-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
