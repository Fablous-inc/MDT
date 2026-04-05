const WORKER_URL = "https://mdt.fetched.workers.dev/";

// Run immediately on page load
(function init() {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (urlToken) {
        localStorage.setItem('mdt_token', urlToken);
        // Clean URL so the token is hidden
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const token = localStorage.getItem('mdt_token');
    
    if (!token) {
        window.location.href = "index.html"; // Kick to login if no token
        return;
    }

    try {
        const user = JSON.parse(atob(token));
        document.getElementById('staff-name').innerText = `Officer: ${user.name}`;
    } catch (e) {
        logout();
    }
})();

function logout() {
    localStorage.removeItem('mdt_token');
    window.location.href = "index.html";
}

async function search() {
    const q = document.getElementById('search-input').value;
    const res = await fetch(`${WORKER_URL}/search?q=${q}`);
    const data = await res.json();
    
    const list = document.getElementById('results-list');
    list.innerHTML = data.map(r => `
        <div class="record-card" onclick="fillForm('${r.pseudonym}', '${r.real_name}', ${r.verified}, \`${r.flags}\`)">
            <strong>${r.pseudonym}</strong> ${r.verified ? '✅' : ''}<br>
            <small style="color: #64748b">${r.real_name || 'No Real Name'}</small>
        </div>
    `).join('');
}

function fillForm(p, r, v, f) {
    document.getElementById('edit-pseudo').value = p;
    document.getElementById('edit-real').value = r;
    document.getElementById('edit-verified').checked = (v === 1);
    document.getElementById('edit-flags').value = (f === "null" || !f) ? "" : f;
}

async function saveRecord() {
    const token = localStorage.getItem('mdt_token');
    const body = {
        pseudonym: document.getElementById('edit-pseudo').value,
        real_name: document.getElementById('edit-real').value,
        verified: document.getElementById('edit-verified').checked,
        flags: document.getElementById('edit-flags').value
    };

    const res = await fetch(`${WORKER_URL}/save`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(body)
    });

    if (res.ok) {
        alert("Database Updated Successfully.");
        search();
    } else {
        alert("Access Denied: You are not authorized.");
    }
}

async function deleteRecord() {
    const pseudo = document.getElementById('edit-pseudo').value;
    if (!pseudo || !confirm(`Permanently delete ${pseudo}?`)) return;

    const token = localStorage.getItem('mdt_token');
    await fetch(`${WORKER_URL}/delete`, {
        method: 'DELETE',
        headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ pseudonym: pseudo })
    });

    alert("Record Purged.");
    location.reload();
}