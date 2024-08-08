// src/utils/storeToken.js

const storeToken = (token) => {
  try {
    // Decode the token to get the payload
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    
    // Calculate the expiry time in milliseconds
    const expiryTime = decodedToken.exp * 1000; // Convert to milliseconds
    
    // Store the token and expiry time in localStorage
    localStorage.setItem('dexkorUserToken', token);
    localStorage.setItem('dexkorUserTokenExpiry', expiryTime.toString());
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

export default storeToken;
