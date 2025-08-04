import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { account, databases, functions, Query, OAuthProvider, ID } from "../appwrite";

const UserContext = createContext();

export const DATABASE_ID = "669318d2002a5431ce91"; 
export const COLLECTION_ID = "6695461400342d012490";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider(props) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const query = useQuery();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Example query parameters from URL
  const limit = query.get("limit");
  const page = query.get("page");
  const owner = query.get("owner");
  const sort = query.get("sort");
  const folder = query.get("folder");
  const message = query.get("message");

  async function listAll() {
    try {
      const queries = [];

      if (limit) {
        queries.push(Query.limit(parseInt(limit)));
      } else {
        queries.push(Query.limit(10));
      }

      if(page) {
        if(limit)
        {
            queries.push(Query.offset( ((parseInt(page) - 1) * parseInt(limit)) ));
        }
        else
        {
          queries.push(Query.offset( ((parseInt(page) - 1) * 10) ));
        }
      } else {
        queries.push(Query.offset(0));
      }

      if(sort === "newest") {
        queries.push(Query.orderDesc("$createdAt"));
      } else if(sort === "oldest") {
        queries.push(Query.orderAsc("$createdAt"));
      } else if(sort === "hot") {
         queries.push(Query.orderDesc("$updatedAt"));
      } else if(sort === "cold") {
        queries.push(Query.orderAsc("$updatedAt"));
      } else {
         queries.push(Query.orderDesc("$updatedAt"));
      }

      if (folder) {
        queries.push(Query.contains("folder", folder));
      }

      if (message) {
        queries.push(Query.contains("message", message));
      }

      if(owner) {
        queries.push(Query.contains("createdBy", owner));
      }

      const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, queries);
      setDocuments(result.documents);
      setTotal(result.total);
    } catch (error) {
      console.error("Error listing documents:", error);
    }
  }

  function goHome()
  {
    window.location.href = '/';
  }

  async function updateDocument(document) {
    try {
      setLoading(true);
      const result = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        document.$id,
        {
          folder: document.folder,
          message: document.message,
          seen: !document.seen
        }
      );
      await listAll(); // Refresh the list
      return result;
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function deleteDocument(documentId) {
    try {
      setLoading(true);
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        documentId
      );
      await listAll(); // Refresh the list
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function createDocument(document) {
    try {
      setLoading(true);
      const result = await functions.createExecution(
        "6836645600114ed67b6c",
        JSON.stringify({
          folder: document.folder,
          message: document.message,
          seen: false,
          //userId: user.$id,
        }),
        false,
        "create",
        "POST"
      );
      
      await listAll(); 
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  
    //console.log(result);
  }

  async function login() {
    if (user === null) {
      account.createOAuth2Session(
        OAuthProvider.Discord,
        "https://evabot.pages.dev/",
        "https://evabot.pages.dev/",
        ["identify"]
      );
    }
  }

  async function logout() {
    try {
      setLoading(true);
      await account.deleteSession("current");
      setUser(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
        await listAll();
      } catch(error) {
        console.error(error);
      } finally {
        setLoading(false);
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
      }, [isDarkMode]);

  useEffect(() => {
    init();
  }, []);

useEffect(() => {
  const fetchAllItems = async () => {
    try {
      await listAll();
      // Handle the result from listAll() here
    } catch (error) {
      console.error("Error listing items:", error);
      // Handle errors appropriately
    }
  };

  fetchAllItems(); // Call the async function immediately
}, [location.search]);

  return (
    <UserContext.Provider value={{ 
      loading,
      user,
      error,
      setError,
      setIsDarkMode,
      isDarkMode,
      goHome,
      documents, 
      total, 
      createDocument, 
      updateDocument, 
      deleteDocument,
      login, 
      logout
    }}>
      {props.children}
    </UserContext.Provider>
  );
}
