import { Client, TablesDB, Account, Functions, OAuthProvider, ID, Query } from "appwrite";

const client = new Client();
client
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // Your API Endpoint
    .setProject('669318be00330e837d7f'); // Your project ID
    
export { OAuthProvider, ID, Query }; 

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const functions = new Functions(client);
