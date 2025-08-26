const axios = require('axios');
const geoip = require('geoip-lite'); // Fallback option

/**
 * Get detailed geolocation using ipapi.co API
 * @param {string} ip - IP address
 * @returns {Promise<Object>} - Detailed geolocation data
 */
const getDetailedGeolocation = async (ip) => {
  try {
    // Handle local/private IPs
    if (isLocalIP(ip)) {
      return getLocalLocationData();
    }

    // Call ipapi.co API
    const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'DevStudio/1.0',
        'Accept': 'application/json'
      }
    });

    const data = response.data;
    
    // Check for API error
    if (data.error || !data.country_code) {
      console.warn('ipapi.co returned error or incomplete data:', data);
      return getFallbackGeolocation(ip);
    }

    console.log(`Geolocation lookup successful: ${data.city}, ${data.country_name} for IP ${ip}`);

    return {
      success: true,
      country: data.country_code,
      countryName: data.country_name,
      region: data.region,
      regionCode: data.region_code,
      city: data.city,
      postal: data.postal,
      latitude: parseFloat(data.latitude) || 0,
      longitude: parseFloat(data.longitude) || 0,
      timezone: data.timezone,
      utcOffset: data.utc_offset,
      org: data.org,
      isp: data.isp,
      asn: data.asn,
      currency: data.currency,
      currencyName: data.currency_name,
      languages: data.languages,
      callingCode: data.country_calling_code,
      isEU: data.in_eu || false,
      isLocal: false,
      isUnknown: false,
      source: 'ipapi.co',
      queriedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('ipapi.co geolocation failed:', error.message);
    
    // Fallback to offline database
    return getFallbackGeolocation(ip);
  }
};

/**
 * Get geolocation with rate limiting and caching
 * @param {string} ip - IP address
 * @returns {Promise<Object>} - Cached or fresh geolocation data
 */
const getCachedGeolocation = async (ip) => {
  try {
    const redisClient = require('../config/redis');
    const cacheKey = `geo_${ip}`;
    
    // Check cache first
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`Using cached geolocation for IP ${ip}`);
      return JSON.parse(cachedData);
    }

    // Get fresh data
    const geoData = await getDetailedGeolocation(ip);
    
    // Cache for 24 hours 
    await redisClient.setex(cacheKey, 24 * 60 * 60, JSON.stringify(geoData));
    
    return geoData;

  } catch (error) {
    console.error('Cached geolocation lookup failed:', error);
    return getFallbackGeolocation(ip);
  }
};

/**
 * Check if IP is local/private
 * @param {string} ip - IP address
 * @returns {boolean} - True if local IP
 */
const isLocalIP = (ip) => {
  if (!ip) return true;
  
  const localPatterns = [
    '127.0.0.1',
    '::1',
    '::ffff:127.0.0.1',
    'localhost'
  ];
  
  // Check exact matches
  if (localPatterns.includes(ip)) return true;
  
  // Check private IP ranges
  const privateRanges = [
    /^192\.168\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^169\.254\./,
    /^::ffff:192\.168\./,
    /^::ffff:10\./
  ];
  
  return privateRanges.some(pattern => pattern.test(ip));
};

/**
 * Get location data for local/development IPs
 * @returns {Object} - Local location data
 */
const getLocalLocationData = () => {
  return {
    success: true,
    country: 'DEV',
    countryName: 'Development Environment',
    region: 'Local',
    regionCode: 'LOCAL',
    city: 'Localhost',
    postal: '00000',
    latitude: 0,
    longitude: 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    utcOffset: new Date().getTimezoneOffset() * -1,
    org: 'Local Network',
    isp: 'Development',
    asn: 'AS0',
    currency: 'USD',
    currencyName: 'US Dollar',
    languages: 'en',
    callingCode: '+1',
    isEU: false,
    isLocal: true,
    isUnknown: false,
    source: 'local',
    queriedAt: new Date().toISOString()
  };
};

/**
 * Fallback geolocation using geoip-lite (offline database)
 * @param {string} ip - IP address
 * @returns {Object} - Basic geolocation data
 */
const getFallbackGeolocation = (ip) => {
  try {
    if (isLocalIP(ip)) {
      return getLocalLocationData();
    }

    // Use geoip-lite as fallback
    const geo = geoip.lookup(ip);
    
    if (!geo) {
      return getUnknownLocationData(ip);
    }

    return {
      success: true,
      country: geo.country,
      countryName: getCountryName(geo.country),
      region: geo.region,
      regionCode: geo.region,
      city: geo.city,
      postal: null,
      latitude: geo.ll[0] || 0,
      longitude: geo.ll[1] || 0,
      timezone: geo.timezone,
      utcOffset: null,
      org: 'Unknown',
      isp: 'Unknown',
      asn: 'Unknown',
      currency: null,
      currencyName: null,
      languages: null,
      callingCode: null,
      isEU: false,
      isLocal: false,
      isUnknown: false,
      source: 'geoip-lite',
      queriedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Fallback geolocation failed:', error);
    return getUnknownLocationData(ip);
  }
};

/**
 * Get unknown location data
 * @param {string} ip - IP address
 * @returns {Object} - Unknown location data
 */
const getUnknownLocationData = (ip) => {
  return {
    success: false,
    country: 'XX',
    countryName: 'Unknown',
    region: 'Unknown',
    regionCode: 'XX',
    city: 'Unknown',
    postal: null,
    latitude: 0,
    longitude: 0,
    timezone: 'UTC',
    utcOffset: 0,
    org: 'Unknown',
    isp: 'Unknown',
    asn: 'Unknown',
    currency: null,
    currencyName: null,
    languages: null,
    callingCode: null,
    isEU: false,
    isLocal: false,
    isUnknown: true,
    source: 'unknown',
    queriedAt: new Date().toISOString(),
    originalIP: ip
  };
};

/**
 * Get country name from country code (basic mapping)
 * @param {string} countryCode - ISO country code
 * @returns {string} - Country name
 */
const getCountryName = (countryCode) => {
  const countryNames = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'BR': 'Brazil',
    'IN': 'India',
    'CN': 'China',
    'JP': 'Japan',
    'KR': 'South Korea',
    'RU': 'Russia',
    'MX': 'Mexico',
    'NL': 'Netherlands',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland'
  };
  
  return countryNames[countryCode] || countryCode;
};

/**
 * Batch geolocation lookup for multiple IPs
 * @param {Array} ips - Array of IP addresses
 * @returns {Promise<Object>} - Map of IP to geolocation data
 */
const batchGeolocation = async (ips) => {
  const results = {};
  
  // Process in batches to respect rate limits
  const batchSize = 5;
  const batches = [];
  
  for (let i = 0; i < ips.length; i += batchSize) {
    batches.push(ips.slice(i, i + batchSize));
  }
  
  for (const batch of batches) {
    const promises = batch.map(async (ip) => {
      try {
        const geo = await getCachedGeolocation(ip);
        return { ip, geo };
      } catch (error) {
        console.error(`Batch geolocation failed for ${ip}:`, error);
        return { ip, geo: getUnknownLocationData(ip) };
      }
    });
    
    const batchResults = await Promise.allSettled(promises);
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        results[result.value.ip] = result.value.geo;
      }
    });
    
    // ADelay between batches to respect rate limits
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }
  
  return results;
};

module.exports = {
  getDetailedGeolocation,
  getCachedGeolocation,
  batchGeolocation,
  isLocalIP,
  getLocalLocationData,
  getFallbackGeolocation,
  getUnknownLocationData
};
