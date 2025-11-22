// Connect to Supabase
const SUPABASE_URL = "https://rowzonuulxhiefncbwnp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvd3pvbnV1bHhoaWVmbmNid25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzg4MzMsImV4cCI6MjA3OTIxNDgzM30.UY_kvKySXU0ExfC8lU-m3QkF7wIAXW_YTg-VaKbWL3U"; // use your anon key here
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Tab navigation
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Auth section references
const signinForm = document.getElementById("signin-form");
const signupForm = document.getElementById("signup-form");
const accountInfo = document.getElementById("account-info");

// Switch between forms
document.getElementById("show-signup").addEventListener("click", () => {
  signinForm.style.display = "none";
  signupForm.style.display = "block";
});
document.getElementById("show-signin").addEventListener("click", () => {
  signupForm.style.display = "none";
  signinForm.style.display = "block";
});

// Sign up
document.getElementById("signup-btn").addEventListener("click", async () => {
  const username = document.getElementById("signup-username").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return alert(error.message);

  const user = data.user;
  if (user) {
    await supabase.from("profiles").insert([{ id: user.id, email, username }]);
    alert("Account created!");
    signupForm.style.display = "none";
    signinForm.style.display = "block";
  }
});

// Sign in
document.getElementById("signin-btn").addEventListener("click", async () => {
  const email = document.getElementById("signin-email").value;
  const password = document.getElementById("signin-password").value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);
  loadAccount();
});

// Load account info
async function loadAccount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  signinForm.style.display = "none";
  signupForm.style.display = "none";
  accountInfo.style.display = "block";

  document.getElementById("user-email").innerText = user.email;

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
  if (profile) document.getElementById("user-username").value = profile.username;
}

// Update username
document.getElementById("update-username").addEventListener("click", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  const newUsername = document.getElementById("user-username").value;
  await supabase.from("profiles").update({ username: newUsername }).eq("id", user.id);
  alert("Username updated!");
});

// Load all users
async function loadUsers() {
  const { data, error } = await supabase.from("profiles").select("username");
  const list = document.getElementById("users-list");
  list.innerHTML = "";
  if (error) return list.innerHTML = "Failed to load users.";
  data.forEach(user => {
    const li = document.createElement("li");
    li.textContent = user.username || "Unnamed";
    list.appendChild(li);
  });
}

loadUsers();

// Logout
document.getElementById("logout-btn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  alert("Logged out!");
  accountInfo.style.display = "none";
  signinForm.style.display = "block";
});

// GitHub OAuth
document.getElementById("github-login").addEventListener("click", () => {
  window.location.href = "/api/auth.js";
});
