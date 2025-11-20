// ---------------------------------------------------------
// NODe Hub - app.js
// ---------------------------------------------------------

// ---------- Supabase Init ----------
const SUPABASE_URL = "https://rowzonuulxhiefncbwnp.supabase.co";
const SUPABASE_ANON =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvd3pvbnV1bHhoaWVmbmNid25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzg4MzMsImV4cCI6MjA3OTIxNDgzM30.UY_kvKySXU0ExfC8lU-m3QkF7wIAXW_YTg-VaKbWL3U";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ---------- DOM Refs ----------
const pages = {
  home: document.getElementById("page-home"),
  browse: document.getElementById("page-browse"),
  create: document.getElementById("page-create"),
  play: document.getElementById("page-play"),
  account: document.getElementById("page-account"),
};

const navButtons = document.querySelectorAll(".nav-btn");
const authArea = document.getElementById("authArea");

// Browse page
const searchInput = document.getElementById("searchInput");
const ratingFilter = document.getElementById("ratingFilter");
const browseGrid = document.getElementById("browseGrid");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageNumberEl = document.getElementById("pageNumber");

// Create page
const createPanel = document.getElementById("createPanel");
const createNotLogged = document.getElementById("createNotLogged");
const gameTitle = document.getElementById("gameTitle");
const gameDesc = document.getElementById("gameDesc");
const gameTags = document.getElementById("gameTags");
const gameRating = document.getElementById("gameRating");
const coverInput = document.getElementById("coverInput");
const screensInput = document.getElementById("screensInput");
const nrfInput = document.getElementById("nrfInput");
const uploadGameBtn = document.getElementById("uploadGameBtn");
const uploadGameStatus = document.getElementById("uploadGameStatus");

// Account page
const accountInfo = document.getElementById("accountInfo");
const usernameArea = document.getElementById("usernameArea");
const usernameInput = document.getElementById("usernameInput");
const usernameStatus = document.getElementById("usernameStatus");
const bioInput = document.getElementById("bioInput");
const bioStatus = document.getElementById("bioStatus");
const avatarInput = document.getElementById("avatarInput");
const avatarStatus = document.getElementById("avatarStatus");
const saveUsernameBtn = document.getElementById("saveUsernameBtn");
const saveBioBtn = document.getElementById("saveBioBtn");
const uploadAvatarBtn = document.getElementById("uploadAvatarBtn");

// Game overlay
const gameOverlay = document.getElementById("gameOverlay");
const closeOverlayBtn = document.getElementById("closeOverlay");
const gameDetail = document.getElementById("gameDetail");
const screenshotGallery = document.getElementById("screenshotGallery");
const versionList = document.getElementById("versionList");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");
const postCommentBtn = document.getElementById("postCommentBtn");

// Profile overlay
const profileOverlay = document.getElementById("profileOverlay");
const closeProfileBtn = document.getElementById("closeProfile");
const profileContent = document.getElementById("profileContent");

// Auth modal
const authModal = document.getElementById("authModal");
const authTitle = document.getElementById("authTitle");
const authEmail = document.getElementById("authEmail");
const authPass = document.getElementById("authPass");
const authUsername = document.getElementById("authUsername");
const authSubmit = document.getElementById("authSubmit");
const authCancel = document.getElementById("authCancel");
const authError = document.getElementById("authError");

// ---------- Global State ----------
let currentUser = null;
let authMode = "signin"; // 'signin' or 'signup'
let currentGameId = null;

// Browse state
const PAGE_SIZE = 12;
let currentBrowsePage = 1;
let totalBrowseCount = 0;
let currentSearch = "";
let currentRatingFilter = "";

// ---------- Page Navigation ----------
function showPage(name) {
  Object.entries(pages).forEach(([key, el]) => {
    el.style.display = key === name ? "block" : "none";
  });
}

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.open;
    showPage(target);
    if (target === "browse") {
      loadBrowsePage();
    }
  });
});

// Default page
showPage("home");

// ---------- Auth Modal ----------
function openAuthModal(mode) {
  authMode = mode;
  authTitle.textContent = mode === "signin" ? "Sign In" : "Sign Up";
  authEmail.value = "";
  authPass.value = "";
  authUsername.value = "";
  authError.textContent = "";
  authModal.style.display = "flex";
}

function closeAuthModal() {
  authModal.style.display = "none";
}

authCancel.addEventListener("click", closeAuthModal);

authSubmit.addEventListener("click", async () => {
  authError.textContent = "";
  const email = authEmail.value.trim();
  const pass = authPass.value;
  const username = authUsername.value.trim();

  if (!email || !pass) {
    authError.textContent = "Email + password required";
    return;
  }

  try {
    if (authMode === "signup") {
      if (!username) {
        authError.textContent = "Username required for sign up";
        return;
      }

      const { error: signUpErr } = await sb.auth.signUp({
        email,
        password: pass,
        options: { emailRedirectTo: undefined }
      });
      if (signUpErr) {
        authError.textContent = signUpErr.message;
        return;
      }

      const { error: loginErr } = await sb.auth.signInWithPassword({ email, password: pass });
      if (loginErr) {
        authError.textContent = loginErr.message;
        return;
      }

      const { data: userData, error: userErr } = await sb.auth.getUser();
      if (userErr || !userData?.user) {
        authError.textContent = userErr?.message || "Could not get user after sign up";
        return;
      }
      const uid = userData.user.id;

      await sb.from("profiles").upsert({ id: uid, username });
    } else {
      const { error: loginErr } = await sb.auth.signInWithPassword({ email, password: pass });
      if (loginErr) {
        authError.textContent = loginErr.message;
        return;
      }
    }

    closeAuthModal();
    await refreshAuthUI();
  } catch (e) {
    console.error(e);
    authError.textContent = e.message || "Auth error";
  }
});

// ---------- Auth UI ----------
async function refreshAuthUI() {
  const { data: sessionData } = await sb.auth.getSession();
  currentUser = sessionData?.session?.user || null;

  if (!currentUser) {
    authArea.innerHTML = `
      <button class="btn" id="btnSignUp">Sign Up</button>
      <button class="btn primary" id="btnSignIn">Sign In</button>
    `;
    const btnSignUp = document.getElementById("btnSignUp");
    const btnSignIn = document.getElementById("btnSignIn");
    btnSignUp.onclick = () => openAuthModal("signup");
    btnSignIn.onclick = () => openAuthModal("signin");

    createPanel.style.display = "none";
    createNotLogged.style.display = "block";

    accountInfo.innerHTML = `<p>You are not signed in.</p>`;
    usernameArea.style.display = "none";
    bioInput.value = "";
    bioStatus.textContent = "";
    avatarStatus.textContent = "";
  } else {
    authArea.innerHTML = `
      <div class="small">Signed in: ${currentUser.email}</div>
      <button class="btn" id="btnSignOut">Sign Out</button>
    `;
    document.getElementById("btnSignOut").onclick = async () => {
      await sb.auth.signOut();
      currentUser = null;
      await refreshAuthUI();
    };

    createPanel.style.display = "block";
    createNotLogged.style.display = "none";

    const { data: profile, error: pErr } = await sb
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    const username = profile?.username || "(no username set)";
    const bio = profile?.bio || "";
    accountInfo.innerHTML = `
      <p><b>Email:</b> ${currentUser.email}</p>
      <p><b>Username:</b> ${username}</p>
    `;
    usernameInput.value = profile?.username || "";
    usernameArea.style.display = "block";
    bioInput.value = bio;
    bioStatus.textContent = "";
    avatarStatus.textContent = "";
  }
}

// Setup auth listener on startup
sb.auth.onAuthStateChange(() => {
  refreshAuthUI();
});
refreshAuthUI();

// ---------- Account Actions (username, bio, avatar) ----------
saveUsernameBtn.addEventListener("click", async () => {
  if (!currentUser) return;
  const newName = usernameInput.value.trim();
  if (!newName) {
    usernameStatus.textContent = "Username cannot be empty.";
    return;
  }

  const { error } = await sb
    .from("profiles")
    .update({ username: newName })
    .eq("id", currentUser.id);

  if (error) {
    usernameStatus.textContent = error.message;
  } else {
    usernameStatus.textContent = "Saved!";
    await refreshAuthUI();
  }
});

saveBioBtn.addEventListener("click", async () => {
  if (!currentUser) return;
  const newBio = bioInput.value.trim();

  const { error } = await sb
    .from("profiles")
    .update({ bio: newBio })
    .eq("id", currentUser.id);

  if (error) {
    bioStatus.textContent = error.message;
  } else {
    bioStatus.textContent = "Bio saved!";
  }
});

uploadAvatarBtn.addEventListener("click", async () => {
  if (!currentUser) return;
  const file = avatarInput.files[0];
  if (!file) {
    avatarStatus.textContent = "Pick an image.";
    return;
  }

  avatarStatus.textContent = "Uploading avatar...";
  const path = `avatars/${currentUser.id}_${Date.now()}_${file.name}`;

  const { error: upErr } = await sb.storage
    .from("profile-avatars")
    .upload(path, file);

  if (upErr) {
    avatarStatus.textContent = "Upload failed: " + upErr.message;
    return;
  }

  const { error: updErr } = await sb
    .from("profiles")
    .update({ avatar_path: path })
    .eq("id", currentUser.id);

  if (updErr) {
    avatarStatus.textContent = "DB error: " + updErr.message;
    return;
  }

  avatarStatus.textContent = "Avatar uploaded!";
});

// ---------- Create Game (upload) ----------
uploadGameBtn.addEventListener("click", async () => {
  uploadGameStatus.textContent = "";

  if (!currentUser) {
    uploadGameStatus.textContent = "Sign in first.";
    return;
  }

  const title = gameTitle.value.trim();
  const desc = gameDesc.value.trim();
  const tags = gameTags.value.trim();
  const rating = gameRating.value;

  const coverFile = coverInput.files[0];
  const nrfFile = nrfInput.files[0];
  const screens = screensInput.files;

  if (!title || !desc || !tags || !rating || !coverFile || !nrfFile) {
    uploadGameStatus.textContent = "Fill in all fields and pick a cover & .nrf file.";
    return;
  }

  if (!nrfFile.name.toLowerCase().endsWith(".nrf")) {
    uploadGameStatus.textContent = "Game file must be a .nrf.";
    return;
  }

  uploadGameStatus.textContent = "Uploading cover...";

  const coverPath = `covers/${currentUser.id}_${Date.now()}_${coverFile.name}`;
  const { error: coverErr } = await sb.storage
    .from("game-assets")
    .upload(coverPath, coverFile);

  if (coverErr) {
    uploadGameStatus.textContent = "Cover upload failed: " + coverErr.message;
    return;
  }

  uploadGameStatus.textContent = "Uploading game file...";
  const gamePath = `games/${currentUser.id}_${Date.now()}_${nrfFile.name}`;
  const { error: gameErr } = await sb.storage
    .from("games")
    .upload(gamePath, nrfFile);

  if (gameErr) {
    uploadGameStatus.textContent = "Game upload failed: " + gameErr.message;
    return;
  }

  const { data: profile } = await sb
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();
  const uname = profile?.username || "UnknownDev";

  uploadGameStatus.textContent = "Saving game metadata...";

  const { data: gameRow, error: insertErr } = await sb
    .from("games")
    .insert([{
      title,
      description: desc,
      filename: nrfFile.name,
      storage_path: gamePath,
      cover_path: coverPath,
      uploader: currentUser.id,
      uploader_email: currentUser.email,
      uploader_username: uname,
      tags,
      age_rating: rating,
      version: "1.0",
      runtime_version: "0.1"
    }])
    .select("*")
    .maybeSingle();

  if (insertErr || !gameRow) {
    uploadGameStatus.textContent = "Database error: " + (insertErr?.message || "Unknown");
    return;
  }

  const gameId = gameRow.id;

  if (screens && screens.length > 0) {
    uploadGameStatus.textContent = "Uploading screenshots...";
    for (let i = 0; i < screens.length; i++) {
      const sf = screens[i];
      const sPath = `screens/${gameId}_${Date.now()}_${i}_${sf.name}`;
      const { error: sErr } = await sb.storage
        .from("game-assets")
        .upload(sPath, sf);

      if (!sErr) {
        await sb.from("game_screenshots").insert([{ game_id: gameId, storage_path: sPath }]);
      }
    }
  }

  await sb.from("game_versions").insert([{
    game_id: gameId,
    version_label: "1.0",
    notes: "Initial release",
    storage_path: gamePath
  }]);

  uploadGameStatus.textContent = "Game uploaded successfully!";
  gameTitle.value = "";
  gameDesc.value = "";
  gameTags.value = "";
  coverInput.value = "";
  screensInput.value = "";
  nrfInput.value = "";
});

// ---------- Browse Page ----------
async function loadBrowsePage() {
  let query = sb.from("games").select("*", { count: "exact" });

  if (currentSearch) {
    query = query.or(`title.ilike.%${currentSearch}%,tags.ilike.%${currentSearch}%`);
  }
  if (currentRatingFilter) {
    query = query.eq("age_rating", currentRatingFilter);
  }

  const from = (currentBrowsePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    browseGrid.innerHTML = `<div class="small error">Failed to load games.</div>`;
    return;
  }

  totalBrowseCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalBrowseCount / PAGE_SIZE));
  if (currentBrowsePage > totalPages) currentBrowsePage = totalPages;

  pageNumberEl.textContent = `Page ${currentBrowsePage} / ${totalPages}`;
  prevPageBtn.disabled = currentBrowsePage <= 1;
  nextPageBtn.disabled = currentBrowsePage >= totalPages;

  if (!data || data.length === 0) {
    browseGrid.innerHTML = `<div class="small">No games found.</div>`;
    return;
  }

  browseGrid.innerHTML = "";

  for (const g of data) {
    let coverUrl = "";
    if (g.cover_path) {
      const { data: coverPub } = sb.storage
        .from("game-assets")
        .getPublicUrl(g.cover_path);
      coverUrl = coverPub.publicUrl;
    }

    const { count: likeCount } = await sb
      .from("game_likes")
      .select("*", { count: "exact", head: true })
      .eq("game_id", g.id);

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="thumb">
        ${coverUrl ? `<img src="${coverUrl}" alt="cover">` : ""}
      </div>
      <div class="meta">
        <div class="title">${escapeHtml(g.title)}</div>
        <div class="desc">by 
          <a href="javascript:void(0)" data-dev="${g.uploader}" class="dev-link">
            ${escapeHtml(g.uploader_username || "UnknownDev")}
          </a>
        </div>
        <div class="small">Rating: ${g.age_rating || "N/A"} | Likes: ${likeCount}</div>
        <button class="btn" data-view="${g.id}">View Game</button>
      </div>
    `;
    browseGrid.appendChild(card);
  }

  browseGrid.querySelectorAll("button[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      const gameId = btn.getAttribute("data-view");
      openGameOverlay(gameId);
    });
  });

  browseGrid.querySelectorAll("a.dev-link").forEach(a => {
    a.addEventListener("click", () => {
      const devId = a.getAttribute("data-dev");
      openProfileOverlay(devId);
    });
  });
}

prevPageBtn.addEventListener("click", () => {
  if (currentBrowsePage > 1) {
    currentBrowsePage--;
    loadBrowsePage();
  }
});
nextPageBtn.addEventListener("click", () => {
  const totalPages = Math.max(1, Math.ceil(totalBrowseCount / PAGE_SIZE));
  if (currentBrowsePage < totalPages) {
    currentBrowsePage++;
    loadBrowsePage();
  }
});

searchInput.addEventListener("input", () => {
  currentSearch = searchInput.value.trim();
  currentBrowsePage = 1;
  loadBrowsePage();
});

ratingFilter.addEventListener("change", () => {
  currentRatingFilter = ratingFilter.value;
  currentBrowsePage = 1;
  loadBrowsePage();
});

// ---------- Game Detail Overlay ----------
async function openGameOverlay(gameId) {
  currentGameId = gameId;
  gameDetail.innerHTML = "Loading...";
  screenshotGallery.innerHTML = "";
  versionList.innerHTML = "";
  commentList.innerHTML = "";
  commentInput.value = "";

  const { data: game, error } = await sb
    .from("games")
    .select("*")
    .eq("id", gameId)
    .maybeSingle();

  if (error || !game) {
    gameDetail.innerHTML = `<div class="small error">Failed to load game.</div>`;
    return;
  }

  let coverUrl = "";
  if (game.cover_path) {
    const { data: coverPub } = sb.storage
      .from("game-assets")
      .getPublicUrl(game.cover_path);
    coverUrl = coverPub.publicUrl;
  }

  const { count: likeCount } = await sb
    .from("game_likes")
    .select("*", { count: "exact", head: true })
    .eq("game_id", game.id);

  let userLiked = false;
  if (currentUser) {
    const { count: myLike } = await sb
      .from("game_likes")
      .select("*", { count: "exact", head: true })
      .eq("game_id", game.id)
      .eq("user_id", currentUser.id);
    userLiked = (myLike || 0) > 0;
  }

  const devId = game.uploader;
  const devName = game.uploader_username || "UnknownDev";

  const { data: nrfPub } = sb.storage
    .from("games")
    .getPublicUrl(game.storage_path);
  const gameUrl = nrfPub.publicUrl;

  gameDetail.innerHTML = `
    <h2>${escapeHtml(game.title)}</h2>
    ${coverUrl ? `<img class="cover" src="${coverUrl}" alt="cover">` : ""}
    <p>${escapeHtml(game.description || "")}</p>
    <p><b>Developer:</b> 
      <a href="javascript:void(0)" class="dev-link" data-dev="${devId}">
        ${escapeHtml(devName)}
      </a>
    </p>
    <p><b>Tags:</b> ${escapeHtml(game.tags || "")}</p>
    <p><b>Age Rating:</b> ${escapeHtml(game.age_rating || "N/A")}</p>
    <p><b>Uploaded:</b> ${new Date(game.created_at).toLocaleDateString()}</p>
    <p><b>Likes:</b> <span id="likeCount">${likeCount}</span></p>
    <button id="likeBtn" class="btn">${userLiked ? "Liked" : "Like"}</button>
    <a class="btn primary" href="${gameUrl}" download>Download Game</a>
  `;

  const devLink = gameDetail.querySelector(".dev-link");
  devLink.addEventListener("click", () => {
    openProfileOverlay(devId);
  });

  const likeBtn = document.getElementById("likeBtn");
  const likeCountEl = document.getElementById("likeCount");

  likeBtn.addEventListener("click", async () => {
    if (!currentUser) {
      alert("Sign in to like games.");
      return;
    }

    if (likeBtn.textContent === "Liked") {
      alert("You already liked this game.");
      return;
    }

    const { error: likeErr } = await sb.from("game_likes").insert([{
      game_id: game.id,
      user_id: currentUser.id
    }]);

    if (likeErr) {
      console.error(likeErr);
      alert("Failed to like game.");
      return;
    }

    const newCount = (parseInt(likeCountEl.textContent, 10) || 0) + 1;
    likeCountEl.textContent = String(newCount);
    likeBtn.textContent = "Liked";
  });

  const { data: shots } = await sb
    .from("game_screenshots")
    .select("*")
    .eq("game_id", game.id)
    .order("created_at", { ascending: true });

  screenshotGallery.innerHTML = "";
  if (shots && shots.length > 0) {
    for (const s of shots) {
      const { data: sPub } = sb.storage
        .from("game-assets")
        .getPublicUrl(s.storage_path);
      const img = document.createElement("img");
      img.src = sPub.publicUrl;
      img.alt = "Screenshot";
      screenshotGallery.appendChild(img);
    }
  } else {
    screenshotGallery.innerHTML = `<div class="small">No screenshots.</div>`;
  }

  const { data: versions } = await sb
    .from("game_versions")
    .select("*")
    .eq("game_id", game.id)
    .order("created_at", { ascending: false });

  versionList.innerHTML = "";
  if (versions && versions.length > 0) {
    versions.forEach(v => {
      const { data: vPub } = sb.storage
        .from("games")
        .getPublicUrl(v.storage_path);
      const row = document.createElement("div");
      row.className = "small";
      row.innerHTML = `
        <p><b>${escapeHtml(v.version_label)}</b> 
        (${new Date(v.created_at).toLocaleDateString()})<br>
        ${escapeHtml(v.notes || "")}<br>
        <a class="btn" href="${vPub.publicUrl}" download>Download this version</a></p>
      `;
      versionList.appendChild(row);
    });
  } else {
    versionList.innerHTML = `<div class="small">No additional versions.</div>`;
  }

  await loadComments(game.id);

  gameOverlay.style.display = "flex";
}

closeOverlayBtn.addEventListener("click", () => {
  gameOverlay.style.display = "none";
  currentGameId = null;
});

// ---------- Comments ----------
async function loadComments(gameId) {
  const { data: comments } = await sb
    .from("game_comments")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  commentList.innerHTML = "";
  if (!comments || comments.length === 0) {
    commentList.innerHTML = `<div class="small">No comments yet.</div>`;
    return;
  }

  for (const c of comments) {
    const div = document.createElement("div");
    div.className = "comment";
    div.innerHTML = `
      <div class="comment-user">${escapeHtml(c.username || "User")}</div>
      <div class="comment-text">${escapeHtml(c.body)}</div>
      <div class="small">${new Date(c.created_at).toLocaleString()}</div>
    `;
    commentList.appendChild(div);
  }
}

postCommentBtn.addEventListener("click", async () => {
  if (!currentUser) {
    alert("Sign in to comment.");
    return;
  }
  if (!currentGameId) return;

  const text = commentInput.value.trim();
  if (!text) return;

  const { data: profile } = await sb
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();
  const uname = profile?.username || currentUser.email;

  await sb.from("game_comments").insert([{
    game_id: currentGameId,
    user_id: currentUser.id,
    username: uname,
    body: text
  }]);

  commentInput.value = "";
  await loadComments(currentGameId);
});

// ---------- Developer Profile Overlay ----------
async function openProfileOverlay(userId) {
  profileContent.innerHTML = "Loading...";

  const { data: profile } = await sb
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  const { data: games } = await sb
    .from("games")
    .select("*")
    .eq("uploader", userId)
    .order("created_at", { ascending: false });

  let avatarUrl = "";
  if (profile?.avatar_path) {
    const { data: aPub } = sb.storage
      .from("profile-avatars")
      .getPublicUrl(profile.avatar_path);
    avatarUrl = aPub.publicUrl;
  }

  let totalLikes = 0;
  if (games && games.length > 0) {
    for (const g of games) {
      const { count: likeCount } = await sb
        .from("game_likes")
        .select("*", { count: "exact", head: true })
        .eq("game_id", g.id);
      totalLikes += likeCount || 0;
    }
  }

  const uname = profile?.username || "(no username)";
  const bio = profile?.bio || "";

  let gamesHtml = "";
  if (games && games.length > 0) {
    gamesHtml += `<div class="profile-games"><div class="profile-games-title">Games</div><div class="profile-games-grid">`;
    games.forEach(g => {
      gamesHtml += `
        <div class="card">
          <div class="meta">
            <div class="title">${escapeHtml(g.title)}</div>
            <div class="small">${new Date(g.created_at).toLocaleDateString()}</div>
            <button class="btn" data-view="${g.id}">View Game</button>
          </div>
        </div>
      `;
    });
    gamesHtml += `</div></div>`;
  } else {
    gamesHtml = `<div class="small">No games yet.</div>`;
  }

  profileContent.innerHTML = `
    ${avatarUrl ? `<img class="avatar" src="${avatarUrl}" alt="avatar">` : ""}
    <div class="profile-username">${escapeHtml(uname)}</div>
    <div class="profile-bio">${escapeHtml(bio)}</div>
    <div class="small">Total Likes: ${totalLikes}</div>
    ${gamesHtml}
  `;

  profileContent.querySelectorAll("button[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      const gid = btn.getAttribute("data-view");
      profileOverlay.style.display = "none";
      openGameOverlay(gid);
    });
  });

  profileOverlay.style.display = "flex";
}

closeProfileBtn.addEventListener("click", () => {
  profileOverlay.style.display = "none";
});

// ---------- Utility ----------
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------- Initial Browse Load ----------
loadBrowsePage();
