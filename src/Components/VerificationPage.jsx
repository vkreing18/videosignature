import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
        setError("Missing authentication parameters.");
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
      <div className="modal-card" style={{ textAlign: 'center' }}>
        <h1 className="teal-title">{error ? "Error" : "Verifying..."}</h1>
        <p className="body-text">{error || "Please wait while we secure your session."}</p>
      </div>
    </div>
  );
}