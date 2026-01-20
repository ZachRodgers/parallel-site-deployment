import React, { useState, useEffect } from 'react';
import './CookieConsent.css';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    } else {
      // Apply font loading based on consent
      if (consent === 'declined') {
        blockGoogleFonts();
      }
    }
  }, []);

  const blockGoogleFonts = () => {
    // Remove Google Fonts link if it exists
    const googleFontsLink = document.querySelector('link[href*="fonts.googleapis.com"]');
    if (googleFontsLink) {
      googleFontsLink.remove();
    }

    // Add fallback font styles
    const style = document.createElement('style');
    style.textContent = `
      body, * {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif !important;
      }
    `;
    document.head.appendChild(style);
  };

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
    blockGoogleFonts();
  };

  const handlePrivacySettings = () => {
    localStorage.removeItem('cookieConsent');
    window.location.reload();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div className="cookie-consent-overlay" />
      <div className="cookie-consent">
        <div className="cookie-consent-content">
          <div className="cookie-consent-header">
            <div className="cookie-consent-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="var(--color-primary)" />
              </svg>
            </div>
            <div className="cookie-consent-text">
              <h3 className="cookie-consent-title">We use cookies</h3>
              <p className="cookie-consent-description">
                We use cookies to enhance your browsing experience and serve personalized content.
                By clicking "Accept All", you consent to our use of cookies. You can manage your preferences in our{' '}
                <button className="cookie-consent-link" onClick={handlePrivacySettings}>
                  Privacy Settings
                </button>.
              </p>
            </div>
          </div>
          <div className="cookie-consent-actions">
            <button className="cookie-consent-btn cookie-consent-btn-decline" onClick={handleDecline}>
              Decline
            </button>
            <button className="cookie-consent-btn cookie-consent-btn-accept" onClick={handleAccept}>
              Accept All
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsent;
