// Major Indian Cities Database with Coordinates
export const INDIAN_CITIES = [
  // Tamil Nadu
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198 },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0081, lng: 76.9958 },
  { name: 'Sivagangai', state: 'Tamil Nadu', lat: 9.8719, lng: 78.4927 },
  { name: 'Manamadurai', state: 'Tamil Nadu', lat: 9.6378, lng: 78.5893 },
  { name: 'Tiruppur', state: 'Tamil Nadu', lat: 11.1085, lng: 77.3411 },
  { name: 'Erode', state: 'Tamil Nadu', lat: 11.3919, lng: 77.7179 },
  { name: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lng: 78.1460 },
  { name: 'Trichy', state: 'Tamil Nadu', lat: 10.7905, lng: 78.7047 },
  { name: 'Kanyakumari', state: 'Tamil Nadu', lat: 8.0883, lng: 77.5385 },

  // Karnataka
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Kochi', state: 'Karnataka', lat: 9.9312, lng: 76.2673 },
  { name: 'Mysore', state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
  { name: 'Mangalore', state: 'Karnataka', lat: 12.8628, lng: 74.8530 },
  { name: 'Belgaum', state: 'Karnataka', lat: 15.8497, lng: 74.4977 },
  { name: 'Hubli', state: 'Karnataka', lat: 15.3647, lng: 75.1240 },

  // Telangana & Andhra Pradesh
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6869, lng: 83.2185 },
  { name: 'Tirupati', state: 'Andhra Pradesh', lat: 13.1886, lng: 79.8260 },

  // Maharashtra
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 74.8260 },
  { name: 'Aurangabad', state: 'Maharashtra', lat: 19.8762, lng: 75.3433 },
  { name: 'Aizawl', state: 'Maharashtra', lat: 23.8103, lng: 92.9376 },

  // Delhi & NCR
  { name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5921, lng: 77.3869 },
  { name: 'Gurgaon', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  { name: 'Faridabad', state: 'Haryana', lat: 28.4089, lng: 77.3178 },

  // Uttar Pradesh
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
  { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  { name: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064 },

  // Rajasthan
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243 },
  { name: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125 },
  { name: 'Kota', state: 'Rajasthan', lat: 25.2138, lng: 75.8648 },
  { name: 'Ajmer', state: 'Rajasthan', lat: 26.4499, lng: 74.6399 },

  // Gujarat
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Surat', state: 'Gujarat', lat: 21.1458, lng: 72.8330 },
  { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812 },
  { name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022 },
  { name: 'Bhavnagar', state: 'Gujarat', lat: 21.7645, lng: 72.1519 },

  // West Bengal
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Darjeeling', state: 'West Bengal', lat: 27.0410, lng: 88.2663 },
  { name: 'Siliguri', state: 'West Bengal', lat: 26.5124, lng: 88.4262 },

  // Punjab
  { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { name: 'Ludhiana', state: 'Punjab', lat: 30.9010, lng: 75.8573 },
  { name: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723 },
  { name: 'Jalandhar', state: 'Punjab', lat: 31.7250, lng: 75.5750 },

  // Himachal Pradesh
  { name: 'Shimla', state: 'Himachal Pradesh', lat: 31.7771, lng: 77.1025 },
  { name: 'Manali', state: 'Himachal Pradesh', lat: 32.2396, lng: 77.1887 },
  { name: 'Kullu', state: 'Himachal Pradesh', lat: 32.2206, lng: 77.1089 },

  // Uttarakhand
  { name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
  { name: 'Nainital', state: 'Uttarakhand', lat: 29.3919, lng: 79.4504 },
  { name: 'Haridwar', state: 'Uttarakhand', lat: 29.9457, lng: 78.1642 },

  // Madhya Pradesh
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864 },
  { name: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lng: 78.1828 },
  { name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864 },

  // Jharkhand
  { name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
  { name: 'Jamshedpur', state: 'Jharkhand', lat: 22.8045, lng: 86.1847 },
  { name: 'Dhanbad', state: 'Jharkhand', lat: 23.7957, lng: 86.4304 },

  // Odisha
  { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
  { name: 'Cuttack', state: 'Odisha', lat: 20.4625, lng: 85.8830 },
  { name: 'Rourkela', state: 'Odisha', lat: 22.2242, lng: 84.8536 },

  // Kerala
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366 },
  { name: 'Kozhikode', state: 'Kerala', lat: 11.2588, lng: 75.7804 },
  { name: 'Kottayam', state: 'Kerala', lat: 9.5915, lng: 76.5215 },

  // Northeast India
  { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
  { name: 'Shillong', state: 'Meghalaya', lat: 25.5788, lng: 91.8933 },
  { name: 'Imphal', state: 'Manipur', lat: 24.8170, lng: 94.9062 },
  { name: 'Aizawl', state: 'Mizoram', lat: 23.8103, lng: 92.9376 },
  { name: 'Agartala', state: 'Tripura', lat: 23.8103, lng: 91.2787 },

  // Ladakh & Union Territories
  { name: 'Leh', state: 'Ladakh', lat: 34.1526, lng: 77.5770 },
  { name: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.0837, lng: 74.7973 },
  { name: 'Jammu', state: 'Jammu & Kashmir', lat: 32.7266, lng: 74.8570 },
  { name: 'Port Blair', state: 'Andaman & Nicobar', lat: 11.7401, lng: 92.6586 },
  { name: 'Puducherry', state: 'Puducherry', lat: 12.0084, lng: 79.8355 },
];

// Search helper function
export const searchCities = (query) => {
  if (!query || query.length < 1) return [];
  
  const searchTerm = query.toLowerCase();
  return INDIAN_CITIES.filter(city => 
    city.name.toLowerCase().includes(searchTerm) || 
    city.state.toLowerCase().includes(searchTerm)
  ).slice(0, 10); // Return top 10 matches
};

// Get city by name
export const getCityByName = (name) => {
  return INDIAN_CITIES.find(city => city.name.toLowerCase() === name.toLowerCase());
};
