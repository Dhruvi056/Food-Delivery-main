import React from "react";
import "./Footer.css";
import { assets } from "../../assets/frontend_assets/assets";
import { toast } from "react-toastify";

const Footer = () => {
  return (
    <div className="footer" id="footer">
      <div className="footer-content">
        <div className="footer-content-left">
          <img src={assets.logo} alt="BiteBlitz Logo" className="bg-white rounded-[10px]" style={{ padding: '4px 12px' }} />
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Cumque
            nostrum iure suscipit maiores non harum incidunt unde magnam
            molestias ipsum qui vel aut natus aspernatur ipsa dignissimos,
            numquam assumenda deserunt.
          </p>
          <div className="footer-social-icons">
            <img src={assets.facebook_icon} alt="" />
            <img src={assets.twitter_icon} alt="" />
            <img src={assets.linkedin_icon} alt="" />
          </div>
        </div>
        <div className="footer-content-center">
          <h2>Company</h2>
          <ul>
            <li>Home</li>
            <li>About us</li>
            <li>Delivery</li>
            <li>Privacy Policy</li>
          </ul>
        </div>
        <div className="footer-content-right">
          <h2>Get in touch</h2>
          <ul>
            <li style={{ cursor: "pointer" }} onClick={() => toast.success("Copied Phone Number!")}>+91 9726927561</li>
            <li style={{ cursor: "pointer" }} onClick={() => window.location.href = "mailto:info@concatstring.com"}>info@concatstring.com</li>
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">
        Copyright 2025 @ BiteBlitz.com - All Right Reserved.
      </p>
    </div>
  );
};

export default Footer;
