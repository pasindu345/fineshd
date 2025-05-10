// Constants for API endpoints
const YOUTUBE_API = 'https://yt-vid.hazex.workers.dev/?url=';
const FACEBOOK_API = 'https://facebook-downloader.apis-bj-devs.workers.dev/?url=';
const TIKTOK_API = 'https://tele-social.vercel.app/down?url=';
const AD_REDIRECT_URL = 'https://adstera.com/redirect';

// DOM elements
const urlForm = document.getElementById('urlForm');
const urlInput = document.getElementById('urlInput');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const btnText = document.getElementById('btnText');
const loadingIcon = document.getElementById('loadingIcon');
const errorContainer = document.getElementById('errorContainer');
const errorMessage = document.getElementById('errorMessage');
const loadingPlaceholder = document.getElementById('loadingPlaceholder');
const resultsContainer = document.getElementById('resultsContainer');
const youtubeResult = document.getElementById('youtubeResult');
const facebookResult = document.getElementById('facebookResult');
const tiktokResult = document.getElementById('tiktokResult');

// YouTube result elements
const youtubeDuration = document.getElementById('youtubeDuration');
const youtubeThumbnail = document.getElementById('youtubeThumbnail');
const youtubeTitle = document.getElementById('youtubeTitle');
const videoOptions = document.getElementById('videoOptions');
const audioOptions = document.getElementById('audioOptions');

// Facebook result elements
const facebookQuality = document.getElementById('facebookQuality');
const facebookThumbnail = document.getElementById('facebookThumbnail');
const facebookDownloadLink = document.getElementById('facebookDownloadLink');

// TikTok result elements
const tiktokPreview = document.getElementById('tiktokPreview');
const tiktokVideoLink = document.getElementById('tiktokVideoLink');
const tiktokAudioLink = document.getElementById('tiktokAudioLink');

// Variable to store download URLs for use after ad redirect
let pendingDownloads = {
  url: null,
  type: null
};

// Set current year in footer
document.getElementById('currentYear').textContent = new Date().getFullYear();

// Check if returning from ad redirect
window.addEventListener('load', () => {
  const hasRedirected = sessionStorage.getItem('adRedirected');
  if (hasRedirected) {
    const savedUrl = sessionStorage.getItem('downloadUrl');
    const savedType = sessionStorage.getItem('downloadType');
    if (savedUrl) {
      // Clear the session storage
      sessionStorage.removeItem('adRedirected');
      sessionStorage.removeItem('downloadUrl');
      sessionStorage.removeItem('downloadType');
      
      // Trigger the actual download
      triggerDownload(savedUrl, savedType);
    }
  }
});

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
  // URL input event listeners
  urlInput.addEventListener('input', toggleClearButton);
  clearBtn.addEventListener('click', clearInput);
  
  // Form submit event
  urlForm.addEventListener('submit', handleFormSubmit);
  
  // Tab switching for YouTube options
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => switchTab(button));
  });
});

// Functions
function toggleClearButton() {
  if (urlInput.value.trim() !== '') {
    clearBtn.classList.remove('hidden');
  } else {
    clearBtn.classList.add('hidden');
  }
}

function clearInput() {
  urlInput.value = '';
  clearBtn.classList.add('hidden');
  urlInput.focus();
}

function switchTab(clickedTab) {
  // Remove active class from all tabs
  document.querySelectorAll('.tab-button').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Add active class to clicked tab
  clickedTab.classList.add('active');
  
  // Hide all content sections
  document.querySelectorAll('.format-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Show the corresponding content section
  const tabId = clickedTab.getAttribute('data-tab');
  document.getElementById(tabId).classList.add('active');
}

function setLoading(isLoading) {
  if (isLoading) {
    btnText.textContent = 'Processing';
    loadingIcon.classList.remove('hidden');
    downloadBtn.disabled = true;
    urlInput.disabled = true;
    loadingPlaceholder.classList.remove('hidden');
  } else {
    btnText.textContent = 'Download';
    loadingIcon.classList.add('hidden');
    downloadBtn.disabled = false;
    urlInput.disabled = false;
    loadingPlaceholder.classList.add('hidden');
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorContainer.classList.remove('hidden');
}

function hideError() {
  errorContainer.classList.add('hidden');
}

function resetResults() {
  youtubeResult.classList.add('hidden');
  facebookResult.classList.add('hidden');
  tiktokResult.classList.add('hidden');
  
  // Clear YouTube options
  videoOptions.innerHTML = '';
  audioOptions.innerHTML = '';
}

function detectPlatform(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  } else if (url.includes('facebook.com') || url.includes('fb.com') || url.includes('fb.watch')) {
    return 'facebook';
  } else if (url.includes('tiktok.com')) {
    return 'tiktok';
  }
  return 'unknown';
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}

async function handleFormSubmit(e) {
  // This is critical - prevent the form from submitting normally
  e.preventDefault();
  
  const url = urlInput.value.trim();
  
  if (!url) {
    showError('Please enter a URL');
    return;
  }
  
  // Reset state
  hideError();
  resetResults();
  setLoading(true);
  
  const platform = detectPlatform(url);
  
  if (platform === 'unknown') {
    setLoading(false);
    showError('Invalid URL. Please enter a valid YouTube, Facebook, or TikTok video URL.');
    return;
  }
  
  try {
    let response;
    let data;
    
    switch (platform) {
      case 'youtube':
        response = await fetch(`${YOUTUBE_API}${encodeURIComponent(url)}`);
        data = await response.json();
        
        if (data.error !== false) {
          throw new Error(data.message || 'Failed to fetch YouTube data');
        }
        
        displayYouTubeResult(data);
        break;
        
      case 'facebook':
        // Fix for Facebook API - add proper error handling and response parsing
        try {
          response = await fetch(`${FACEBOOK_API}${encodeURIComponent(url)}`);
          data = await response.json();
          
          // Add more robust check for Facebook response
          if (!data.status || !data.data || !data.data.url) {
            throw new Error('Invalid Facebook video data received');
          }
          
          displayFacebookResult(data);
        } catch (fbError) {
          console.error('Facebook download error:', fbError);
          throw new Error('Failed to fetch Facebook video. Please check the URL and try again.');
        }
        break;
        
      case 'tiktok':
        // Fix for TikTok API - improve error handling and response parsing
        try {
          response = await fetch(`${TIKTOK_API}${encodeURIComponent(url)}`);
          data = await response.json();
          
          // Handle different TikTok API response formats
          if (data.error || !data.status || !data.data) {
            throw new Error(data.message || 'Invalid TikTok response');
          }
          
          // Check if we have video URL in the response
          if (!data.data.video && !data.data.nowm) {
            throw new Error('No video URL found in TikTok response');
          }
          
          displayTikTokResult(data);
        } catch (tkError) {
          console.error('TikTok download error:', tkError);
          throw new Error('Failed to fetch TikTok video. Please check the URL and try again.');
        }
        break;
    }
  } catch (error) {
    showError(error.message || 'An unexpected error occurred');
  } finally {
    setLoading(false);
  }
}

function displayYouTubeResult(data) {
  // Set basic info
  youtubeDuration.textContent = formatDuration(parseInt(data.duration));
  youtubeThumbnail.src = data.thumbnail;
  youtubeThumbnail.alt = data.title;
  youtubeTitle.textContent = data.title;
  
  // Generate video with audio options
  videoOptions.innerHTML = '';
  data.video_with_audio.forEach(option => {
    const downloadButton = createDownloadButton(option, 'video');
    videoOptions.appendChild(downloadButton);
  });
  
  // Add video-only options
  data.video_only.forEach(option => {
    const downloadButton = createDownloadButton({
      ...option,
      label: `${option.label} (No Audio)`
    }, 'video-only');
    videoOptions.appendChild(downloadButton);
  });
  
  // Generate audio options
  audioOptions.innerHTML = '';
  data.audio.forEach(option => {
    const downloadButton = createDownloadButton(option, 'audio');
    audioOptions.appendChild(downloadButton);
  });
  
  // Show the result
  youtubeResult.classList.remove('hidden');
  
  // Reset to video tab
  document.querySelector('.tab-button[data-tab="video-tab"]').click();
}

function displayFacebookResult(data) {
  // Make sure we have valid data
  if (!data.data) {
    showError('Invalid Facebook response data');
    return;
  }
  
  facebookQuality.textContent = data.data.quality || 'HD';
  
  // Add fallback for thumbnail
  if (data.data.thumbnail) {
    facebookThumbnail.src = data.data.thumbnail;
    facebookThumbnail.onerror = () => {
      facebookThumbnail.src = 'https://via.placeholder.com/320x180?text=Facebook+Video';
    };
  } else {
    facebookThumbnail.src = 'https://via.placeholder.com/320x180?text=Facebook+Video';
  }
  
  // Set up download with ad redirect
  facebookDownloadLink.removeEventListener('click', facebookDownloadHandler);
  facebookDownloadLink.addEventListener('click', facebookDownloadHandler);
  
  // Store the download URL for later use
  facebookDownloadLink.dataset.downloadUrl = data.data.url;
  
  // Show the result
  facebookResult.classList.remove('hidden');
}

function facebookDownloadHandler(e) {
  e.preventDefault();
  const downloadUrl = e.currentTarget.dataset.downloadUrl;
  redirectToAdThenDownload(downloadUrl, 'video/mp4');
}

function displayTikTokResult(data) {
  // Make sure we have valid data
  if (!data.data) {
    showError('Invalid TikTok response data');
    return;
  }
  
  // Handle different TikTok API response formats
  const videoUrl = data.data.video || data.data.nowm || '';
  const audioUrl = data.data.audio || data.data.music || '';
  
  if (!videoUrl) {
    showError('No video URL found in TikTok response');
    return;
  }
  
  // Set video preview
  tiktokPreview.src = videoUrl;
  tiktokPreview.onerror = () => {
    tiktokPreview.style.display = 'none';
    const fallbackImg = document.createElement('img');
    fallbackImg.src = 'https://via.placeholder.com/320x180?text=TikTok+Video';
    fallbackImg.alt = 'TikTok Video Preview';
    fallbackImg.style.width = '100%';
    fallbackImg.style.borderRadius = '0.5rem';
    tiktokPreview.parentNode.appendChild(fallbackImg);
  };
  
  // Set up download with ad redirect for video
  tiktokVideoLink.removeEventListener('click', tiktokVideoDownloadHandler);
  tiktokVideoLink.addEventListener('click', tiktokVideoDownloadHandler);
  tiktokVideoLink.dataset.downloadUrl = videoUrl;
  
  // Set up download with ad redirect for audio if available
  if (audioUrl) {
    tiktokAudioLink.style.display = 'flex';
    tiktokAudioLink.removeEventListener('click', tiktokAudioDownloadHandler);
    tiktokAudioLink.addEventListener('click', tiktokAudioDownloadHandler);
    tiktokAudioLink.dataset.downloadUrl = audioUrl;
  } else {
    tiktokAudioLink.style.display = 'none';
  }
  
  // Show the result
  tiktokResult.classList.remove('hidden');
}

function tiktokVideoDownloadHandler(e) {
  e.preventDefault();
  const downloadUrl = e.currentTarget.dataset.downloadUrl;
  redirectToAdThenDownload(downloadUrl, 'video/mp4');
}

function tiktokAudioDownloadHandler(e) {
  e.preventDefault();
  const downloadUrl = e.currentTarget.dataset.downloadUrl;
  redirectToAdThenDownload(downloadUrl, 'audio/mp3');
}

// Function to redirect to ad and then download
function redirectToAdThenDownload(url, type) {
  if (!url) return;
  
  // Store download info in session storage
  sessionStorage.setItem('downloadUrl', url);
  sessionStorage.setItem('downloadType', type);
  sessionStorage.setItem('adRedirected', 'true');
  
  // Redirect to ad page
  window.location.href = AD_REDIRECT_URL;
}

// Function to trigger actual download
function triggerDownload(url, type) {
  const a = document.createElement('a');
  a.href = url;
  a.download = generateFileName(type);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Generate filename based on content type
function generateFileName(type) {
  const timestamp = new Date().getTime();
  if (type.includes('audio')) {
    return `audio_${timestamp}.mp3`;
  } else {
    return `video_${timestamp}.mp4`;
  }
}

function createDownloadButton(option, type) {
  const div = document.createElement('div');
  
  const link = document.createElement('a');
  link.href = 'javascript:void(0)';  // Changed to use our custom handler
  link.dataset.downloadUrl = option.url;
  link.dataset.downloadType = type === 'audio' ? 'audio/mp3' : 'video/mp4';
  
  // Set appropriate class and icon based on type
  let className = '';
  let iconClass = '';
  
  if (type === 'video') {
    className = 'download-button video';
    iconClass = 'fas fa-video';
  } else if (type === 'audio') {
    className = 'download-button audio';
    iconClass = 'fas fa-music';
  } else {
    className = 'download-button video-only';
    iconClass = 'fas fa-film';
  }
  
  link.className = className;
  
  const icon = document.createElement('i');
  icon.className = iconClass;
  
  const span = document.createElement('span');
  span.textContent = option.label;
  
  link.appendChild(icon);
  link.appendChild(span);
  div.appendChild(link);
  
  // Add click handler for ad redirect
  link.addEventListener('click', function(e) {
    e.preventDefault();
    redirectToAdThenDownload(this.dataset.downloadUrl, this.dataset.downloadType);
  });
  
  return div;
}
