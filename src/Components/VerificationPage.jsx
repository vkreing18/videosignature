import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import infoIcon from '../assets/info-icon.svg';
import greenTick from '../assets/green-tick.svg';
import './VideoSignature.css';

export default function VerificationPage() {
  const [searchParams] = useSearchParams();
  const [isLaptop, setIsLaptop] = useState(true);
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyUser = async () => {
      const tokenParam = searchParams.get('token');
      const userId = searchParams.get('userId');

      if (!tokenParam || !userId) {
        setError("Invalid Access Link");
        return;
      }

      try {
        const baseURL = 'YOUR_API_BASE_URL';
        const res = await axios.get(`${baseURL}/verifyUserForVideoInterview`, {
          headers: {
            Authorization: `Bearer ${tokenParam}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.status === 200) {
          // Store token/userId in sessionStorage for the next page to use
          sessionStorage.setItem('authToken', tokenParam);
          sessionStorage.setItem('userId', userId);
          navigate('/videosignature');
        }
      } catch (err) {
        setError("Verification failed. Please try again.");
      }
    };

    verifyUser();
  }, [searchParams, navigate]);
    useEffect(() => {
    const checkDevice = () => setIsLaptop(window.innerWidth >= 1024);
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

    if (!isLaptop)
    return <MobileBlocker />;

  return (
    <div className="fullscreen-container">
      <div className="instruction-modal">
        <div className="modal-header">
          <h1 className="teal-title">Verification Failed !</h1>
        </div>
        <div className="divider" />
        <div className="modal-body">
          <div className="instruction-item">
            <div className="icon-circle teal-glow">
              <img src={infoIcon} alt="Info" className="icon-img" />
            </div>
            <div className="text-container">
              <h3 className="sub-heading">Invalid URL</h3>
              <p className="body-text">
                The link you used appears to be malformed or incorrect. Please verify that you have copied the entire URL correctly from your invitation email or message.
              </p>
            </div>
          </div>
          <div className="instruction-item">
            <div className="icon-circle teal-glow">
              <img src={infoIcon} alt="Info" className="icon-img" />
            </div>
            <div className="text-container">
              <h3 className="sub-heading">Time Expired</h3>
              <p className="body-text">
                Your verification link has expired for security reasons. Links are typically valid for a limited time to ensure secure access. Please request a new invitation.
              </p>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={() => navigate('/')} className="teal-continue-btn">
            Okay
          </button>
        </div>
      </div>
    </div>
  );
}