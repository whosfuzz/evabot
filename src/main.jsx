import './index.css';

import { React } from "react";
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App.jsx';
import LoadingWrapper from './LoadingWrapper.jsx'; // Import the new wrapper
import { UserProvider } from '../lib/context/user';
import NoMatch from './NoMatch.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <UserProvider>
     <LoadingWrapper>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="*" element={<NoMatch />} />
        </Routes>
      </LoadingWrapper>
    </UserProvider>
  </BrowserRouter>
);