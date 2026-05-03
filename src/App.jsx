import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/Employees/EmployeeList';
import EmployeeForm from './pages/Employees/EmployeeForm';
import ImportEmployees from './pages/Employees/ImportEmployees';
import Layout from './components/Layout';

const Prot = ({children}) => { 
  const {isAuthenticated, loading} = useAuth(); 
  if(loading) return <div className="min-h-screen flex items-center justify-center text-green-700">Loading TaniHR...</div>; 
  return isAuthenticated ? children : <Navigate to="/login" />; 
};

export default function App() { 
  const {isAuthenticated} = useAuth(); 
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard"/> : <Login/>} />
        <Route path="/dashboard" element={<Prot><Layout><Dashboard/></Layout></Prot>} />
        <Route path="/employees" element={<Prot><Layout><EmployeeList/></Layout></Prot>} />
        <Route path="/employees/new" element={<Prot><Layout><EmployeeForm/></Layout></Prot>} />
        <Route path="/employees/edit/:id" element={<Prot><Layout><EmployeeForm editMode={true}/></Layout></Prot>} />
        <Route path="/import" element={<Prot><Layout><ImportEmployees/></Layout></Prot>} />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  ); 
}
