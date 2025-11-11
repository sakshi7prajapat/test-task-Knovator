import axios from 'axios';
import xml2js from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(xml2js.parseString);

/**
 * List of job feed URLs to fetch from
 */
export const JOB_FEED_URLS = [
  'https://jobicy.com/?feed=job_feed',
  'https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time',
  'https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france',
  'https://jobicy.com/?feed=job_feed&job_categories=design-multimedia',
  'https://jobicy.com/?feed=job_feed&job_categories=data-science',
  'https://jobicy.com/?feed=job_feed&job_categories=copywriting',
  'https://jobicy.com/?feed=job_feed&job_categories=business',
  'https://jobicy.com/?feed=job_feed&job_categories=management',
  'https://www.higheredjobs.com/rss/articleFeed.cfm',
];

/**
 * Fetches jobs from a given API URL and converts XML to JSON
 * @param {string} url - The API URL to fetch from
 * @returns {Promise<Array>} Array of job objects
 */
export const fetchJobsFromAPI = async (url) => {
  try {
    console.log(`📡 Fetching jobs from: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobImporter/1.0)',
      },
    });

    // Parse XML to JSON
    const xmlData = response.data;
    const jsonData = await parseXML(xmlData);

    // Extract jobs from different feed formats
    const jobs = extractJobsFromFeed(jsonData, url);
    
    console.log(`✅ Fetched ${jobs.length} jobs from ${url}`);
    return jobs;
  } catch (error) {
    console.error(`❌ Error fetching jobs from ${url}:`, error.message);
    throw new Error(`Failed to fetch jobs from ${url}: ${error.message}`);
  }
};

/**
 * Extracts job data from parsed XML feed
 * Handles different RSS/XML feed formats
 */
const extractJobsFromFeed = (jsonData, sourceUrl) => {
  const jobs = [];

  try {
    // Handle Jobicy RSS format
    if (jsonData.rss && jsonData.rss.channel && jsonData.rss.channel[0]) {
      const channel = jsonData.rss.channel[0];
      const items = channel.item || [];

      items.forEach((item) => {
        const job = {
          externalId: extractValue(item, 'guid') || extractValue(item, 'link') || generateId(item),
          title: extractValue(item, 'title') || '',
          description: extractValue(item, 'description') || '',
          company: extractValue(item, 'company') || extractValue(item, 'dc:creator') || '',
          location: extractValue(item, 'location') || extractValue(item, 'jobLocation') || '',
          jobType: extractValue(item, 'jobType') || extractValue(item, 'type') || '',
          category: extractValue(item, 'category') || '',
          salary: extractValue(item, 'salary') || '',
          applyUrl: extractValue(item, 'link') || extractValue(item, 'url') || '',
          publishedDate: parseDate(extractValue(item, 'pubDate') || extractValue(item, 'publishedDate')),
          sourceUrl: sourceUrl,
          rawData: item,
        };
        jobs.push(job);
      });
    }
    // Handle HigherEdJobs format
    else if (jsonData.feed && jsonData.feed.entry) {
      const entries = Array.isArray(jsonData.feed.entry) ? jsonData.feed.entry : [jsonData.feed.entry];
      
      entries.forEach((entry) => {
        const job = {
          externalId: extractValue(entry, 'id') || generateId(entry),
          title: extractValue(entry, 'title') || '',
          description: extractValue(entry, 'content') || extractValue(entry, 'summary') || '',
          company: extractValue(entry, 'author') || '',
          location: extractValue(entry, 'location') || '',
          jobType: '',
          category: '',
          salary: '',
          applyUrl: extractValue(entry, 'link') || '',
          publishedDate: parseDate(extractValue(entry, 'published') || extractValue(entry, 'updated')),
          sourceUrl: sourceUrl,
          rawData: entry,
        };
        jobs.push(job);
      });
    }
  } catch (error) {
    console.error('Error extracting jobs from feed:', error);
  }

  return jobs;
};

/**
 * Helper to extract value from XML object (handles arrays and nested objects)
 */
const extractValue = (obj, key) => {
  if (!obj || !obj[key]) return null;
  
  const value = obj[key];
  if (Array.isArray(value) && value.length > 0) {
    return typeof value[0] === 'string' ? value[0] : (value[0]._ || value[0]);
  }
  if (typeof value === 'string') return value;
  if (value && value._) return value._;
  return null;
};

/**
 * Parse date string to Date object
 */
const parseDate = (dateString) => {
  if (!dateString) return new Date();
  try {
    return new Date(dateString);
  } catch {
    return new Date();
  }
};

/**
 * Generate a unique ID from job data if no ID is available
 */
const generateId = (item) => {
  const title = extractValue(item, 'title') || '';
  const link = extractValue(item, 'link') || '';
  return Buffer.from(`${title}-${link}`).toString('base64').substring(0, 50);
};

/**
 * Fetch jobs from all configured APIs
 * @returns {Promise<Array>} Array of {url, jobs} objects
 */
export const fetchAllJobFeeds = async () => {
  const results = [];
  
  for (const url of JOB_FEED_URLS) {
    try {
      const jobs = await fetchJobsFromAPI(url);
      results.push({ url, jobs });
    } catch (error) {
      console.error(`Failed to fetch from ${url}:`, error.message);
      results.push({ url, jobs: [], error: error.message });
    }
  }
  
  return results;
};

