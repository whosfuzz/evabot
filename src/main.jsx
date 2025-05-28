import './index.css';

import { React } from "react";
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App.jsx';
import { UserProvider } from '../lib/context/user';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <UserProvider>
      <Routes>
        <Route index element={<App />} />
      </Routes>
    </UserProvider>
  </BrowserRouter>
);