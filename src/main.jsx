import './index.css';
import { React } from "react";
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Table from './Table.jsx';
import Table2 from './Table2.jsx';
import Success from './Success.jsx';
import LoadingWrapper from './LoadingWrapper.jsx';
import { UserProvider } from '../lib/context/user';
import NoMatch from './NoMatch.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <UserProvider>
      <LoadingWrapper>
        <Routes>
            <Route path="/" element={
              <Table
                databaseId="669318d2002a5431ce91"
                tableId="6695461400342d012490"
              />
            }/>
            <Route path="/folders" element={
              <Table2
                databaseId="669318d2002a5431ce91"
                tableId="68b28927000dbf87a0aa"
              />
            }/>
            <Route path="/success" element={<Success />} />
            <Route path="*" element={<NoMatch />} />
        </Routes>
      </LoadingWrapper>
    </UserProvider>
  </BrowserRouter>
);

/*
<Route path="/folders" element={
  <Table
    databaseId="669318d2002a5431ce91"
    tableId="68b28927000dbf87a0aa"
    visibleColumns={["folder", "weekday", "$createdAt", "seen"]}
    editableColumns={["folder", "weekday", "seen"]}
  />
}/>
*/