// Constants for API endpoints
const YOUTUBE_API = 'https://yt-vid.hazex.workers.dev/?url=';
const FACEBOOK_API = 'https://facebook-downloader.apis-bj-devs.workers.dev/?url=';
const TIKTOK_API = 'https://tiktok-dl.akalankanime11.workers.dev/?url=';

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

// Set current year in footer
document.getElementById('currentYear').textContent = new Date().getFullYear();

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
        response = await fetch(`${FACEBOOK_API}${encodeURIComponent(url)}`);
        data = await response.json();
        
        if (!data.status) {
          throw new Error('Failed to fetch Facebook video data');
        }
        
        displayFacebookResult(data);
        break;
        
      case 'tiktok':
        response = await fetch(`${TIKTOK_API}${encodeURIComponent(url)}`);
        data = await response.json();
        
        if (!data.status) {
          throw new Error('Failed to fetch TikTok video data');
        }
        
        displayTikTokResult(data);
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
  facebookQuality.textContent = data.data.quality || 'HD';
  facebookThumbnail.src = data.data.thumbnail;
  facebookDownloadLink.href = data.data.url;
  
  // Show the result
  facebookResult.classList.remove('hidden');
}

function displayTikTokResult(data) {
  tiktokPreview.src = data.data.video;
  tiktokVideoLink.href = data.data.video;
  tiktokAudioLink.href = data.data.audio;
  
  // Show the result
  tiktokResult.classList.remove('hidden');
}

function createDownloadButton(option, type) {
  const div = document.createElement('div');
  
  const link = document.createElement('a');
  link.href = option.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.download = '';
  
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
  
  return div;
}
