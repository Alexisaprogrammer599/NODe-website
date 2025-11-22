// Supabase Connection
const SUPABASE_URL = "https://rowzonuulxhiefncbwnp.supabase.co";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"; // replace with your anon key
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Tab navigation
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".tab-section").forEach(tab => tab.classList.remove("active"));
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Auth elements
const signinForm = document.getElementById("signin-form");
const signupForm = document.getElementById("signup-form");
const accountInfo = document.getElementById("account-info");
const loader = document.getElementById("users-loader");
const overlay = document.getElementById("loading-overlay");

// Helper functions
function showLoader(show) {
  overlay.style.display = show ? "flex" : "none";
}

// Switch forms
document.getElementById("show-signup").onclick = () => {
  signinForm.style.display = "none";
  signupForm.style.display = "block";
};
document.getElementById("show-signin").onclick = () => {
  signupForm.style.display = "none";
  signinForm.style.display = "block";
};

// Sign Up
document.getElementById("signup-btn").onclick = async () => {
  const username = document.getElementById("signup-username").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  if (!username || !email || !password) return alert("Please fill all fields.");

  showLoader(true);
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) return alert(error.message);

  const user = data.user;
  await supabaseClient.from("profiles").insert([{ id: user.id, email, username }]);
  showLoader(false);
  alert("Account created! Please sign in.");
  signupForm.style.display = "none";
  signinForm.style.display = "block";
};

// Sign In
document.getElementById("signin-btn").onclick = async () => {
  const email = document.getElementById("signin-email").value.trim();
  const password = document.getElementById("signin-password").value.trim();
  showLoader(true);
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  showLoader(false);
  if (error) return alert(error.message);
  loadAccount();
};

// Load Account
async function loadAccount() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;
  signinForm.style.display = "none";
  signupForm.style.display = "none";
  accountInfo.style.display = "block";
  document.getElementById("user-email").innerText = user.email;
  const { data: profile } = await supabaseClient.from("profiles").select("username").eq("id", user.id).single();
  if (profile) document.getElementById("user-username").value = profile.username;
}

// Update Username
document.getElementById("update-username").onclick = async () => {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const newUsername = document.getElementById("user-username").value.trim();
  if (!newUsername) return alert("Username cannot be empty.");
  showLoader(true);
  await supabaseClient.from("profiles").update({ username: newUsername }).eq("id", user.id);
  showLoader(false);
  alert("Username updated!");
};

// Load Users
async function loadUsers() {
  loader.style.display = "block";
  const { data, error } = await supabaseClient.from("profiles").select("username");
  loader.style.display = "none";
  const list = document.getElementById("users-list");
  list.innerHTML = "";
  if (error) return (list.innerHTML = "Failed to load users.");
  data.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u.username || "Unnamed User";
    list.appendChild(li);
  });
}
loadUsers();

// Logout
document.getElementById("logout-btn").onclick = async () => {
  await supabaseClient.auth.signOut();
  accountInfo.style.display = "none";
  signinForm.style.display = "block";
  alert("Logged out!");
};

// GitHub login (still optional)
document.getElementById("github-login").onclick = () => {
  window.location.href = "/api/auth.js";
};
