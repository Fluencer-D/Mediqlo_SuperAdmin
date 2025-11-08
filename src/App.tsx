import React, { useState, useEffect } from 'react';

// --- MOCK LOGO ---
// In a real app, you would import this: import MediqloLogo from "./assets/mediqlo-logo.png";
import MediqloLogo from "./assets/mediqlo-logo.png";


// --- CONSTANTS ---
// UPDATED: This now matches the feature schema from your backend code.
const FEATURES = [
  { key: 'appointments', label: 'Appointments' },
  { key: 'patientManagement', label: 'Patient Mgt.' },
  { key: 'doctorManagement', label: 'Doctor Mgt.' },
  { key: 'departmentManagement', label: 'Dept. Mgt.' },
  // { key: 'billing', label: 'Billing' },
  // { key: 'reporting', label: 'Reporting' },
];


// --- TYPE DEFINITIONS ---

// UPDATED: Interface for the features object to match the backend model.
interface HospitalFeatures {
  appointments: boolean;
  patientManagement: boolean;
  doctorManagement: boolean;
  departmentManagement: boolean;
  billing: boolean;
  reporting: boolean;
  [key: string]: boolean; // Index signature for dynamic access
}

// UPDATED: Hospital interface now includes the detailed 'features' object.
interface Hospital {
  _id: string;
  hospitalCode: string;
  name: string;
  isActive: boolean;
  features: HospitalFeatures;
  createdAt: string;
  updatedAt: string;
}

interface LoginScreenProps {
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
}

interface HospitalDashboardProps {
  token: string;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
}


// --- LOGIN SCREEN COMPONENT ---
const LoginScreen: React.FC<LoginScreenProps> = ({ setToken }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // In a real app, this URL would come from environment variables
      const apiUrl = `${import.meta.env.API_URL || 'http://localhost:5000'}/api/auth/login`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to login.');
      }

      if (data.token) {
        localStorage.setItem('superAdminToken', data.token);
        setToken(data.token);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-lg rounded-2xl">
        <div className="text-center">
          <img src={MediqloLogo} alt="Mediqlo Logo" className="w-auto h-10 m-auto" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Super Admin Login</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="p-3 text-sm text-center text-red-800 bg-red-100 rounded-lg">{error}</div>}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input id="email-address" name="email" type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required className="relative block w-full px-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Email address" />
            </div>
            <div>
              <label htmlFor="password-sr" className="sr-only">Password</label>
              <input id="password-sr" name="password" type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required className="relative block w-full px-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Password" />
            </div>
          </div>
          <div>
            <button type="submit" disabled={isLoading} className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg group hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- HOSPITAL DASHBOARD COMPONENT ---
const HospitalDashboard: React.FC<HospitalDashboardProps> = ({ token, setToken }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const handleLogout = () => {
    localStorage.removeItem('superAdminToken');
    setToken(null);
  };

  const handleFeatureToggle = async (hospitalId: string, featureKey: string, isEnabled: boolean) => {
    const originalHospitals = [...hospitals];

    // Optimistically update UI
    setHospitals(currentHospitals =>
      currentHospitals.map(hospital =>
        hospital._id === hospitalId
          ? { ...hospital, features: { ...hospital.features, [featureKey]: isEnabled } }
          : hospital
      )
    );

    try {
      // This API endpoint matches the one defined in your backend routes
      const apiUrl = `${import.meta.env.API_URL || 'http://localhost:5000'}/api/hospitals/${hospitalId}/features`;

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          features: { [featureKey]: isEnabled }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update feature.');
      }

      // Optional: You can refresh the specific hospital data from the response
      const updatedData = await response.json();
      setHospitals(current => current.map(h => h._id === hospitalId ? updatedData.data.hospital : h));


    } catch (err) {
      console.error("Failed to toggle feature:", err);
      alert('Could not update feature settings. Reverting change.');
      setHospitals(originalHospitals); // Revert on failure
    }
  };

  useEffect(() => {
    const apiUrl = `${import.meta.env.API_URL || 'http://localhost:5000'}/api/hospitals`;
    const fetchHospitals = async () => {
      setLoading(true);
      try {
        const response = await fetch(apiUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) {
          handleLogout();
          return;
        }
        if (!response.ok) throw new Error('Could not fetch hospital data.');
        const data = await response.json();
        setHospitals(data.data.hospitals);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchHospitals();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <img src={MediqloLogo} alt="Mediqlo Logo" className="h-10 w-auto" />
            <h1 className="text-xl font-bold text-gray-800">Super Admin Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Registered Hospitals</h2>
        {loading && <p className="text-center text-gray-600">Loading hospitals...</p>}
        {error && <p className="text-center text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Registered</th>
                  {/* Dynamically generate a header for each feature */}
                  {FEATURES.map(feature => (
                    <th key={feature.key} scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {feature.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hospitals.map((hospital) => (
                  <tr key={hospital._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{hospital.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(hospital.createdAt).toLocaleDateString()}
                    </td>
                    {/* Dynamically generate a toggle switch for each feature */}
                    {FEATURES.map(feature => (
                      <td key={feature.key} className="px-4 py-4 whitespace-nowrap text-center">
                        <label htmlFor={`${hospital._id}-${feature.key}`} className="flex items-center justify-center cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              id={`${hospital._id}-${feature.key}`}
                              className="sr-only peer"
                              checked={hospital.features?.[feature.key] || false}
                              onChange={(e) => handleFeatureToggle(hospital._id, feature.key, e.target.checked)}
                            />
                            <div className="block bg-gray-200 w-10 h-6 rounded-full peer-checked:bg-blue-600 transition"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-full"></div>
                          </div>
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};


// --- MAIN APP COMPONENT ---
export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('superAdminToken'));

  return (
    <div>
      {token ? <HospitalDashboard token={token} setToken={setToken} /> : <LoginScreen setToken={setToken} />}
    </div>
  );
}
