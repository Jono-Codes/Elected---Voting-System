let currentUser = '';
let selectedPositionId = '';
let selectedCandidateId = '';
let countdownInterval = null;


function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}


async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const error = document.getElementById('loginError');

  try {
    const res = await fetch('/login_api/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = username;
      error.textContent = '';
      showPage('ballotPage');
      document.getElementById('endSessionBtn').style.display = 'block';
      await loadPositions();
    } else {
      error.textContent = data.message;
    }
  } catch (err) {
    error.textContent = 'Server error, try again.';
  }
}

async function logout() {
  await fetch('/logout_api/', { method: 'POST' });
  currentUser = '';
  selectedPositionId = '';
  selectedCandidateId = '';
  clearInterval(countdownInterval);
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  showPage('loginPage');
}

async function loadPositions() {
  const res = await fetch('/results_api/');
  const results = await res.json();

  const positionsContainer = document.getElementById('ballotSelection');
  positionsContainer.innerHTML = '';


  const positionsMap = {};
  results.forEach(c => {
    if (!positionsMap[c.position]) positionsMap[c.position] = [];
    positionsMap[c.position].push(c);
  });

  Object.keys(positionsMap).forEach(pos => {
    const div = document.createElement('div');
    div.className = 'ballot-option';
    div.dataset.positionId = pos; 
    div.textContent = pos;
    div.onclick = () => selectBallot(pos);
    positionsContainer.appendChild(div);
  });
}


async function selectBallot(positionName) {
  selectedPositionId = positionName;
  const res = await fetch('/results_api/');
  const results = await res.json();

  const candidates = results.filter(c => c.position === positionName);

  document.getElementById('votingHeading').textContent = `${positionName} Ballot`;
  document.getElementById('votingSubtitle').textContent = 'Select your preferred candidate';
  const votingOptions = document.getElementById('votingOptions');
  votingOptions.innerHTML = '';

  candidates.forEach(c => {
    const div = document.createElement('div');
    div.className = 'candidate-card';
    
    // --- START MODIFICATION FOR IMAGE ---
    let imageHtml = '';
    if (c.image_url) {
        // Use the image_url from the API
        imageHtml = `<img src="${c.image_url}" alt="${c.name}" class="candidate-photo">`;
    } else {
        // Fallback for candidates without an image (using a placeholder icon)
        imageHtml = `<div class="candidate-placeholder">👤</div>`;
    }
    
    div.innerHTML = `
        <div class="card-image-wrapper">${imageHtml}</div>
        <div class="card-info">
            <h4 class="candidate-name">${c.name}</h4>
            ${c.party ? `<p class="candidate-party">Party: ${c.party}</p>` : ''}
        </div>
    `;
    // --- END MODIFICATION FOR IMAGE ---
    
    div.onclick = () => {
        // Remove 'selected' class from all cards first
        document.querySelectorAll('.candidate-card').forEach(card => card.classList.remove('selected'));
        // Add 'selected' class to the clicked card
        div.classList.add('selected'); 

      selectedCandidateId = c.id;
      document.getElementById('selectedChoice').textContent = c.name;
      document.getElementById('voteSummary').style.display = 'block';
    };
    votingOptions.appendChild(div);
  });

  showPage('votingPage');
}


async function castVote() {
  if (!selectedCandidateId) {
    document.getElementById('votingError').textContent = 'Select a candidate first!';
    return;
  }

  const res = await fetch('/vote_api/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateId: selectedCandidateId })
  });
    
  const data = await res.json();

  if (data.success) {
    showPage('successPage');
    startCountdown(3);
  } else {
    // Display error message from the API (e.g., already voted)
    document.getElementById('votingError').textContent = data.message || 'An error occurred while casting your vote.';
  }
}


function startCountdown(seconds) {
  clearInterval(countdownInterval);
  let time = seconds;
  document.getElementById('countdownTimer').textContent = time;
  document.getElementById('countdownDisplay').textContent = time;
  document.getElementById('countdownOverlay').classList.add('active');

  countdownInterval = setInterval(() => {
    time--;
    document.getElementById('countdownTimer').textContent = time;
    document.getElementById('countdownDisplay').textContent = time;
    if (time <= 0) {
      clearInterval(countdownInterval);
      document.getElementById('countdownOverlay').classList.remove('active');
      updateLiveResults();
      showPage('resultsPage');
    }
  }, 1000);
}


async function updateLiveResults() {
  const res = await fetch('/results_api/');
  const results = await res.json();
  const container = document.getElementById('liveResultsContainer');
  container.innerHTML = '';

  results.forEach(c => {
    const wrapper = document.createElement('div');
    wrapper.style.textAlign = 'center';

    const bubble = document.createElement('div');
    bubble.className = 'live-bubble';
    bubble.innerText = c.votes;

    const label = document.createElement('div');
    label.className = 'live-label';
    label.innerText = c.name;

    wrapper.appendChild(bubble);
    wrapper.appendChild(label);
    container.appendChild(wrapper);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginBtn').onclick = login;
  document.getElementById('logoutBtn2').onclick = logout;
  document.getElementById('logoutBtn3').onclick = logout;
  document.getElementById('endSessionBtn').onclick = logout;
  document.getElementById('castVoteBtn').onclick = castVote;
  document.getElementById('backToBallotBtn').onclick = () => showPage('ballotPage');
  document.getElementById('backToBallotBtn2').onclick = () => showPage('ballotPage');
});