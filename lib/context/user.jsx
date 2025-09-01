import { createContext, useContext, useEffect, useState } from "react";
import { account, tablesDB, functions, Query, OAuthProvider, ID } from "../appwrite";

const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider(props) {
    
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  
  async function createRow(row, endpoint)
  {
    try {
      //setLoading(true);
      const result = await functions.createExecution(
        '6836645600114ed67b6c', 
        JSON.stringify(row),
        false,
        endpoint,
        "POST"
      );
     // await listRows(); 
    } catch (error) {
      setError("An error occurred while creating row");
      console.error("Error creating message: ", error.code);
      throw(error);
    } finally {
      //setLoading(false);
    }
  }
  async function updateRow(_databaseId, _tableId, _rowId, _data, _permissions) {
    try
    {
      //setLoading(true);
      const result = await tablesDB.updateRow({
        databaseId: _databaseId,
        tableId: _tableId,
        rowId: _rowId,
        data: _data,
        _permissions
      });
      //await listRows();
    }
    catch(error)
    {
      setError(error.message);
      //setError("An error occurred while updating row");
      console.error("Error updating row", error);
      throw(error);
    }
    finally
    {
      //setLoading(false);
    }
  }

  async function deleteRow(_databaseId, _tableId, _rowId)
  {
    try
    {
      //setLoading(true);
      const result = await tablesDB.deleteRow({
        databaseId: _databaseId,
        tableId: _tableId,
        rowId: _rowId
      });
    }
    catch(error)
    {
      setError(error.message);

      //setError("An error occurred while deleting row");
      console.error("Error deleting row", error);
      throw(error);
    }
    finally
    {
      //setLoading(false);
    }
  }

  async function listRows(_databaseID, _tableID, _queries) {
    try {
      const result = await tablesDB.listRows({
        databaseId: _databaseID,
        tableId: _tableID,
        queries: _queries
      });
      setRows(result.rows);
      setTotal(result.total);
    } catch (error) {
      setError(error.message);

      //setError("An error occurred while listing rows");
      console.error("Error listing documents:", error);
      throw(error);
    }
  }

  async function login() {
    if (user === null) {
      account.createOAuth2Session(
      {
          provider: OAuthProvider.Discord,
          success: "https://evabot.pages.dev/success",
          failure: "https://evabot.pages.dev/failure",
          scopes: ['identify'] // optional
      });
    }
  }

  async function logout() {
    try {
      //setLoading(true);
      await account.deleteSession({sessionId: 'current'});
      setUser(null);
    } catch (err) {
      console.error(err);
    } finally {
      //setLoading(false);
    }
  }

  async function init() {
    try {
      const loggedIn = await account.get();
      setUser(loggedIn);
    } catch (error) {
      console.error(error);
    } finally {
      try {
       // await listRows();
      } catch(error) {
        console.error(error);
      } finally {
        //setLoading(false);
      }
    }
  }
    
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);
    
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    init();
  }, [isDarkMode]);

  /*
  useEffect(() => {
    init();
  }, []);*/

  return (
    <UserContext.Provider value={{ 
      loading,
      user,
      error,
      setLoading,
      setError,
      setIsDarkMode,
      isDarkMode,
      rows, 
      total,
      createRow, 
      updateRow,
      deleteRow,
      listRows,
      login,
      logout
    }}>
      {props.children}
    </UserContext.Provider>
  );
}
