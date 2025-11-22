// Supabase setup
const SUPABASE_URL = "https://rowzonuulxhiefncbwnp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvd3pvbnV1bHhoaWVmbmNid25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzg4MzMsImV4cCI6MjA3OTIxNDgzM30.UY_kvKySXU0ExfC8lU-m3QkF7wIAXW_YTg-VaKbWL3U";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Tab Navigation
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Sign Up
document.getElementById("signup-btn").onclick = async () => {
  const username = document.getElementById("signup-username").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  if (!username || !email || !password) return alert("Please fill all fields.");

  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) return alert(error.message);

  const user = data.user;
  if (user) {
    await supabaseClient.from("profiles").insert([{ id: user.id, email, username }]);
    alert("Account created! Please sign in.");
    document.getElementById("signup-form").style.display = "none";
    document.getElementById("signin-form").style.display = "block";
  }
};

// Switch Sign In/Sign Up
document.getElementById("show-signup").onclick = () => {
  document.getElementById("signin-form").style.display = "none";
  document.getElementById("signup-form").style.display = "block";
};
document.getElementById("show-signin").onclick = () => {
  document.getElementById("signup-form").style.display = "none";
  document.getElementById("signin-form").style.display = "block";
};

// Sign In
document.getElementById("signin-btn").onclick = async () => {
  const email = document.getElementById("signin-email").value.trim();
  const password = document.getElementById("signin-password").value.trim();

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);

  loadAccount();
};

// Load Account Info
async function loadAccount() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  document.getElementById("signin-form").style.display = "none";
  document.getElementById("signup-form").style.display = "none";
  document.getElementById("account-info").style.display = "block";
  document.getElementById("user-email").innerText = user.email;

  const { data: profile } = await supabaseClient.from("profiles").select("username").eq("id", user.id).single();
  if (profile) document.getElementById("user-username").value = profile.username;
}

// Update Username
document.getElementById("update-username").onclick = async () => {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const newUsername = document.getElementById("user-username").value.trim();
  if (!newUsername) return alert("Username cannot be empty.");

  const { error } = await supabaseClient.from("profiles").update({ username: newUsername }).eq("id", user.id);
  if (error) return alert("Error updating username.");
  alert("Username updated!");
  loadUsers();
};

// Load Users
async function loadUsers() {
  const loader = document.getElementById("users-loader");
  const list = document.getElementById("users-list");
  loader.style.display = "block";
  list.innerHTML = "";

  const { data, error } = await supabaseClient.from("profiles").select("username");
  loader.style.display = "none";
  if (error) return (list.innerHTML = "Error loading users.");
  data.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u.username || "Unnamed";
    list.appendChild(li);
  });
}

// Load Games
async function loadGames() {
  const loader = document.getElementById("games-loader");
  const grid = document.getElementById("games-grid");
  loader.style.display = "block";
  grid.innerHTML = "";

  const { data, error } = await supabaseClient.from("games").select("*");
  loader.style.display = "none";

  if (error || !data.length) {
    grid.innerHTML = "<p>No games found.</p>";
    return;
  }

  data.forEach(game => {
    const card = document.createElement("div");
    card.className = "game-card";

    const img = document.createElement("img");
    img.src = `${SUPABASE_URL}/storage/v1/object/public/game-assets/${game.storage_path}`;
    img.alt = game.title;

    const content = document.createElement("div");
    content.className = "game-card-content";
    content.innerHTML = `
      <h3>${game.title}</h3>
      <p><strong>By:</strong> ${game.author}</p>
      <p>${game.description || ""}</p>
      <a href="${SUPABASE_URL}/storage/v1/object/public/games/${game.storage_path}" class="button" target="_blank">Download</a>
    `;

    card.appendChild(img);
    card.appendChild(content);
    grid.appendChild(card);
  });
}

// Logout
document.getElementById("logout-btn").onclick = async () => {
  await supabaseClient.auth.signOut();
  document.getElementById("account-info").style.display = "none";
  document.getElementById("signin-form").style.display = "block";
  alert("Logged out!");
};

// Load initial data
loadUsers();
loadGames();
