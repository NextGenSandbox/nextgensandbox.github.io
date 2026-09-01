```javascript
const SUPABASE_URL =
  "https://hzazezszxbgethzkqmmf.supabase.co";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6YXplenN6eGJlZ3RoemtxbW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjA3NjQsImV4cCI6MjEwMzgzNjc2NH0.Vgi0AbiYnzPOD_uVafIMcUbNS-DbnD16BlVYTuHopQA";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

let currentUser = null;
let currentUsername = null;
let categories = [];
let currentThreadId = null;

const authPage = document.getElementById("authPage");
const forumHome = document.getElementById("forumHome");
const newThreadPage = document.getElementById("newThreadPage");
const threadPage = document.getElementById("threadPage");

const userbar = document.getElementById("userbar");
const usernameDisplay = document.getElementById("usernameDisplay");

const authMessage = document.getElementById("authMessage");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const authBtn = document.getElementById("authBtn");

const categoryGrid = document.getElementById("categoryGrid");
const categorySelect = document.getElementById("categorySelect");
const threadCategory = document.getElementById("threadCategory");

const searchInput = document.getElementById("searchInput");
const threadsList = document.getElementById("threadsList");

const threadContainer =
  document.getElementById("threadContainer");

const replyInput =
  document.getElementById("replyInput");

const replyMessage =
  document.getElementById("replyMessage");

let authMode = "login";


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function usernameToEmail(username) {
  return `${username}@forum.androidhostfile.local`;
}


function validUsername(username) {
  return /^[a-z0-9_-]{3,24}$/.test(username);
}


function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString();
}


function showMessage(element, text, type = "error") {
  element.textContent = text;

  element.className =
    type === "success"
      ? "message-success"
      : "message-error";
}


function clearMessage(element) {
  element.textContent = "";
  element.className = "";
}


function hideAllPages() {
  forumHome.classList.add("hidden");
  newThreadPage.classList.add("hidden");
  threadPage.classList.add("hidden");
}


```javascript
/* =========================================================
   AUTHENTICATION
   ========================================================= */

let currentUser = null;
let currentUsername = null;
let isAnonymous = false;

const authPage =
  document.getElementById("authPage");

const userbar =
  document.getElementById("userbar");

const usernameDisplay =
  document.getElementById("usernameDisplay");

const authMessage =
  document.getElementById("authMessage");

const usernameInput =
  document.getElementById("usernameInput");

const passwordInput =
  document.getElementById("passwordInput");

const authBtn =
  document.getElementById("authBtn");

let authMode = "login";


function usernameToEmail(username) {
  return `${username}@forum.androidhostfile.local`;
}


function validUsername(username) {
  return /^[a-z0-9_-]{3,24}$/.test(username);
}


function showAuthMessage(message, success = false) {
  authMessage.textContent = message;

  authMessage.className =
    success
      ? "message-success"
      : "message-error";
}


function clearAuthMessage() {
  authMessage.textContent = "";
  authMessage.className = "";
}


/* ---------------------------------------------------------
   LOGIN TAB
   --------------------------------------------------------- */

document
  .getElementById("loginTab")
  .addEventListener("click", () => {

    authMode = "login";

    document
      .getElementById("loginTab")
      .classList.add("active");

    document
      .getElementById("registerTab")
      .classList.remove("active");

    document.getElementById("authTitle")
      .textContent = "Sign In";

    authBtn.textContent = "Sign In";

    clearAuthMessage();
  });


/* ---------------------------------------------------------
   REGISTER TAB
   --------------------------------------------------------- */

document
  .getElementById("registerTab")
  .addEventListener("click", () => {

    authMode = "register";

    document
      .getElementById("registerTab")
      .classList.add("active");

    document
      .getElementById("loginTab")
      .classList.remove("active");

    document.getElementById("authTitle")
      .textContent = "Create Account";

    authBtn.textContent = "Create Account";

    clearAuthMessage();
  });


/* ---------------------------------------------------------
   REGISTER / LOGIN
   --------------------------------------------------------- */

authBtn.addEventListener(
  "click",
  authenticate
);


async function authenticate() {

  const username =
    usernameInput.value
      .trim()
      .toLowerCase();

  const password =
    passwordInput.value;

  clearAuthMessage();

  if (!validUsername(username)) {
    showAuthMessage(
      "Username must be 3–24 characters and use only letters, numbers, underscores or hyphens."
    );
    return;
  }

  if (password.length < 6) {
    showAuthMessage(
      "Password must contain at least 6 characters."
    );
    return;
  }

  authBtn.disabled = true;

  try {

    const email =
      usernameToEmail(username);


    /* =====================================================
       REGISTER
       ===================================================== */

    if (authMode === "register") {

      authBtn.textContent =
        "Creating account...";


      /*
       * IMPORTANT:
       *
       * If this browser currently has an anonymous session,
       * sign out first so the new registration is a completely
       * separate permanent account.
       */

      const {
        data: existingSession
      } =
        await supabaseClient.auth.getSession();


      if (
        existingSession?.session?.user
        &&
        existingSession.session.user.is_anonymous
      ) {
        await supabaseClient.auth.signOut();
      }


      const {
        data,
        error
      } =
        await supabaseClient.auth.signUp({

          email,

          password,

          options: {
            data: {
              username
            }
          }

        });


      if (error) {
        throw error;
      }


      /*
       * Confirm email MUST be disabled for this
       * username-only system.
       */

      if (!data.session) {

        showAuthMessage(
          "Account created, but Supabase email confirmation is enabled. Turn Confirm email OFF in Authentication → Providers → Email."
        );

        return;
      }


      usernameInput.value = "";
      passwordInput.value = "";

      await activateRegisteredUser(
        data.user
      );

      return;
    }


    /* =====================================================
       LOGIN
       ===================================================== */

    authBtn.textContent =
      "Signing in...";


    /*
     * If we're currently anonymous, remove the temporary
     * session before signing into the permanent account.
     */

    const {
      data: currentSession
    } =
      await supabaseClient.auth.getSession();


    if (
      currentSession?.session?.user
      &&
      currentSession.session.user.is_anonymous
    ) {

      await supabaseClient.auth.signOut();
    }


    const {
      data,
      error
    } =
      await supabaseClient.auth
        .signInWithPassword({

          email,

          password

        });


    if (error) {
      throw error;
    }


    usernameInput.value = "";
    passwordInput.value = "";

    await activateRegisteredUser(
      data.user
    );


  } catch (error) {

    console.error(
      "Authentication error:",
      error
    );

    showAuthMessage(
      error.message ||
      "Unable to sign in."
    );

  } finally {

    authBtn.disabled = false;

    authBtn.textContent =
      authMode === "login"
        ? "Sign In"
        : "Create Account";
  }
}


/* =========================================================
   ACTIVATE REGISTERED ACCOUNT
   ========================================================= */

async function activateRegisteredUser(user) {

  currentUser = user;

  isAnonymous =
    Boolean(user.is_anonymous);


  /*
   * Get username from metadata first.
   */

  let username =
    user.user_metadata?.username;


  /*
   * If metadata isn't available, get profile.
   */

  if (!username) {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();


    if (!error) {
      username =
        data?.username;
    }
  }


  currentUsername =
    username || "User";


  usernameDisplay.textContent =
    currentUsername;


  authPage.classList.add("hidden");
  userbar.classList.remove("hidden");


  await loadCategories();
  await loadThreads();

  showForum();
}


/* =========================================================
   CREATE ANONYMOUS SESSION
   ========================================================= */

async function createAnonymousSession() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .signInAnonymously();


    if (error) {
      throw error;
    }


    if (!data?.user) {
      throw new Error(
        "Supabase did not return an anonymous user."
      );
    }


    currentUser =
      data.user;

    isAnonymous = true;

    currentUsername =
      "Anonymous";


    usernameDisplay.textContent =
      "Anonymous";


    userbar.classList.remove("hidden");
    authPage.classList.add("hidden");


    await loadCategories();
    await loadThreads();

    showForum();


  } catch (error) {

    console.error(
      "Anonymous sign-in error:",
      error
    );

    /*
     * If anonymous sign-in is disabled, the visitor can
     * still use the login/register screen.
     */

    currentUser = null;
    isAnonymous = false;

    userbar.classList.add("hidden");
    authPage.classList.remove("hidden");

    showAuthMessage(
      "Could not create a guest session: " +
      error.message
    );
  }
}


/* =========================================================
   LOGOUT
   ========================================================= */

document
  .getElementById("logoutBtn")
  .addEventListener(
    "click",
    async () => {

      try {

        await supabaseClient.auth.signOut();

        currentUser = null;
        currentUsername = null;
        isAnonymous = false;

        /*
         * Immediately create another anonymous session so
         * the visitor can continue browsing.
         */

        await createAnonymousSession();

      } catch (error) {

        console.error(error);

        showAuthMessage(
          "Could not log out: " +
          error.message
        );
      }
    }
  );


/* =========================================================
   PROTECT POSTING
   ========================================================= */

function requireRegisteredUser() {

  if (!currentUser) {

    alert(
      "Please sign in or create an account first."
    );

    return false;
  }


  if (isAnonymous || currentUser.is_anonymous) {

    alert(
      "Please create an account or sign in before posting."
    );

    return false;
  }


  return true;
}


/* =========================================================
   AUTH STATE
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    if (!session?.user) {
      return;
    }


    /*
     * Anonymous user
     */

    if (session.user.is_anonymous) {

      currentUser =
        session.user;

      currentUsername =
        "Anonymous";

      isAnonymous = true;

      usernameDisplay.textContent =
        "Anonymous";

      userbar.classList.remove(
        "hidden"
      );

      authPage.classList.add(
        "hidden"
      );

      return;
    }


    /*
     * Permanent user
     */

    if (
      !currentUser ||
      currentUser.id !== session.user.id
    ) {

      await activateRegisteredUser(
        session.user
      );
    }

  }
);


/* =========================================================
   INITIAL STARTUP
   ========================================================= */

async function initializeAuth() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .getSession();


    if (error) {
      throw error;
    }


    /*
     * Existing session
     */

    if (data.session?.user) {

      if (
        data.session.user.is_anonymous
      ) {

        currentUser =
          data.session.user;

        currentUsername =
          "Anonymous";

        isAnonymous = true;

        usernameDisplay.textContent =
          "Anonymous";

        userbar.classList.remove(
          "hidden"
        );

        authPage.classList.add(
          "hidden"
        );

        await loadCategories();
        await loadThreads();

        showForum();

      } else {

        await activateRegisteredUser(
          data.session.user
        );
      }

      return;
    }


    /*
     * No session:
     * create a guest session automatically.
     */

    await createAnonymousSession();


  } catch (error) {

    console.error(error);

    showAuthMessage(
      "Authentication startup failed: " +
      error.message
    );
  }
}


initializeAuth();
```


/* =========================================================
   CATEGORIES
   ========================================================= */

async function loadCategories() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("forum_categories")
      .select("*")
      .order("sort_order", {
        ascending: true
      });

  if (error) {
    console.error(error);

    categoryGrid.innerHTML =
      `<div class="message-error">
        ${escapeHtml(error.message)}
      </div>`;

    return;
  }

  categories = data || [];

  categoryGrid.innerHTML =
    categories
      .map(category => `
        <a
          href="#"
          class="category-card"
          data-id="${escapeHtml(category.id)}"
        >

          <div class="category-icon">
            ${escapeHtml(category.icon || "📁")}
          </div>

          <h3>
            ${escapeHtml(category.name)}
          </h3>

          <p>
            ${escapeHtml(category.description || "")}
          </p>

        </a>
      `)
      .join("");


  categorySelect.innerHTML =
    `<option value="all">
      All Categories
    </option>`;

  threadCategory.innerHTML = "";


  categories.forEach(category => {

    const option =
      document.createElement("option");

    option.value =
      category.id;

    option.textContent =
      category.name;

    categorySelect.appendChild(
      option.cloneNode(true)
    );

    threadCategory.appendChild(
      option
    );
  });


  document
    .querySelectorAll(".category-card")
    .forEach(card => {

      card.addEventListener(
        "click",
        event => {

          event.preventDefault();

          categorySelect.value =
            card.dataset.id;

          loadThreads();
        }
      );
    });
}


/* =========================================================
   THREAD LIST
   ========================================================= */

async function loadThreads() {

  threadsList.innerHTML =
    `<div class="empty">
      Loading discussions...
    </div>`;


  let query =
    supabaseClient
      .from("forum_threads")
      .select(`
        id,
        title,
        username,
        device,
        codename,
        android_version,
        thread_type,
        created_at,
        category_id,
        forum_categories (
          name,
          icon
        )
      `)
      .order("created_at", {
        ascending: false
      })
      .limit(100);


  const category =
    categorySelect.value;

  if (
    category &&
    category !== "all"
  ) {
    query =
      query.eq(
        "category_id",
        category
      );
  }


  const search =
    searchInput.value.trim();

  if (search) {
    query =
      query.or(
        `title.ilike.%${search}%,device.ilike.%${search}%,codename.ilike.%${search}%`
      );
  }


  const {
    data,
    error
  } = await query;


  if (error) {

    console.error(error);

    threadsList.innerHTML =
      `<div class="message-error">
        ${escapeHtml(error.message)}
      </div>`;

    return;
  }


  if (!data?.length) {

    threadsList.innerHTML =
      `<div class="empty">
        No discussions found.
      </div>`;

    return;
  }


  threadsList.innerHTML =
    data
      .map(thread => {

        const category =
          thread.forum_categories;

        return `
          <a
            href="#"
            class="thread-card"
            data-thread="${escapeHtml(thread.id)}"
          >

            <div class="thread-title">
              ${escapeHtml(thread.title)}
            </div>

            <div style="margin-bottom:7px">

              <span class="badge">
                ${escapeHtml(
                  category?.icon || "📁"
                )}

                ${escapeHtml(
                  category?.name || "General"
                )}
              </span>

              <span class="badge">
                ${escapeHtml(
                  thread.thread_type
                )}
              </span>

              ${
                thread.device
                  ? `
                    <span class="badge">
                      ${escapeHtml(
                        thread.device
                      )}
                    </span>
                  `
                  : ""
              }

            </div>

            <div class="thread-meta">
              ${escapeHtml(thread.username)}
              •
              ${formatDate(thread.created_at)}

              ${
                thread.codename
                  ? ` • ${escapeHtml(thread.codename)}`
                  : ""
              }
            </div>

          </a>
        `;
      })
      .join("");


  document
    .querySelectorAll("[data-thread]")
    .forEach(element => {

      element.addEventListener(
        "click",
        event => {

          event.preventDefault();

          openThread(
            element.dataset.thread
          );
        }
      );
    });
}


let searchTimer;

searchInput.addEventListener(
  "input",
  () => {

    clearTimeout(searchTimer);

    searchTimer =
      setTimeout(
        loadThreads,
        250
      );
  }
);


categorySelect.addEventListener(
  "change",
  loadThreads
);


/* =========================================================
   NEW THREAD
   ========================================================= */

document
  .getElementById("newThreadBtn")
  .addEventListener(
    "click",
    () => {

      if (!currentUser) {
        alert("Please sign in first.");
        return;
      }

      clearMessage(
        document.getElementById(
          "threadMessage"
        )
      );

      showNewThread();
    }
  );


function showNewThread() {
  hideAllPages();
  newThreadPage.classList.remove("hidden");
}


document
  .getElementById("backFromThreadBtn")
  .addEventListener(
    "click",
    showForum
  );


/* =========================================================
   CREATE THREAD
   ========================================================= */

document
  .getElementById("publishThreadBtn")
  .addEventListener(
    "click",
    async () => {

      const message =
        document.getElementById(
          "threadMessage"
        );

      const title =
        document.getElementById(
          "threadTitle"
        ).value.trim();

      const categoryId =
        threadCategory.value;

      const type =
        document.getElementById(
          "threadType"
        ).value;

      const device =
        document.getElementById(
          "threadDevice"
        ).value.trim();

      const codename =
        document.getElementById(
          "threadCodename"
        ).value.trim();

      const androidVersion =
        document.getElementById(
          "threadAndroid"
        ).value.trim();

      const content =
        document.getElementById(
          "threadContent"
        ).value.trim();

      const button =
        document.getElementById(
          "publishThreadBtn"
        );


      clearMessage(message);


      if (!currentUser) {
        showMessage(
          message,
          "You must be logged in."
        );
        return;
      }


      if (title.length < 3) {
        showMessage(
          message,
          "Enter a longer title."
        );
        return;
      }


      if (!categoryId) {
        showMessage(
          message,
          "Select a category."
        );
        return;
      }


      if (!content) {
        showMessage(
          message,
          "Write something in your post."
        );
        return;
      }


      button.disabled = true;
      button.textContent =
        "Publishing...";


      try {

        const {
          error
        } =
          await supabaseClient
            .from("forum_threads")
            .insert({
              user_id:
                currentUser.id,

              category_id:
                categoryId,

              username:
                currentUsername,

              title,

              thread_type:
                type,

              device:
                device || null,

              codename:
                codename || null,

              android_version:
                androidVersion || null,

              content
            });


        if (error) {
          throw error;
        }


        document.getElementById(
          "threadTitle"
        ).value = "";

        document.getElementById(
          "threadDevice"
        ).value = "";

        document.getElementById(
          "threadCodename"
        ).value = "";

        document.getElementById(
          "threadAndroid"
        ).value = "";

        document.getElementById(
          "threadContent"
        ).value = "";


        showMessage(
          message,
          "Thread published!",
          "success"
        );


        await loadThreads();


        setTimeout(
          showForum,
          500
        );


      } catch (error) {

        console.error(error);

        showMessage(
          message,
          error.message ||
          "Could not publish thread."
        );

      } finally {

        button.disabled = false;
        button.textContent =
          "Publish Thread";
      }
    }
  );


/* =========================================================
   OPEN THREAD
   ========================================================= */

async function openThread(threadId) {

  currentThreadId = threadId;

  showThread();

  threadContainer.innerHTML =
    `<div class="empty">
      Loading thread...
    </div>`;


  const {
    data: thread,
    error: threadError
  } =
    await supabaseClient
      .from("forum_threads")
      .select(`
        *,
        forum_categories (
          name,
          icon
        )
      `)
      .eq("id", threadId)
      .single();


  if (threadError) {

    threadContainer.innerHTML =
      `<div class="message-error">
        ${escapeHtml(threadError.message)}
      </div>`;

    return;
  }


  const {
    data: replies,
    error: repliesError
  } =
    await supabaseClient
      .from("forum_replies")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", {
        ascending: true
      });


  if (repliesError) {

    threadContainer.innerHTML =
      `<div class="message-error">
        ${escapeHtml(repliesError.message)}
      </div>`;

    return;
  }


  renderThread(
    thread,
    replies || []
  );
}


/* =========================================================
   RENDER THREAD
   ========================================================= */

function renderThread(thread, replies) {

  let html = "";


  html += `
    <div class="box">

      <h2>
        ${escapeHtml(thread.title)}
      </h2>

      <div style="margin:10px 0">

        <span class="badge">
          ${escapeHtml(
            thread.forum_categories?.icon || "📁"
          )}

          ${escapeHtml(
            thread.forum_categories?.name || "General"
          )}
        </span>

        <span class="badge">
          ${escapeHtml(thread.thread_type)}
        </span>

      </div>

      ${
        thread.device ||
        thread.codename ||
        thread.android_version
          ? `
            <div class="device-box">

              ${
                thread.device
                  ? `
                    <div>
                      <strong>Device:</strong>
                      ${escapeHtml(thread.device)}
                    </div>
                  `
                  : ""
              }

              ${
                thread.codename
                  ? `
                    <div>
                      <strong>Codename:</strong>
                      ${escapeHtml(thread.codename)}
                    </div>
                  `
                  : ""
              }

              ${
                thread.android_version
                  ? `
                    <div>
                      <strong>Android:</strong>
                      ${escapeHtml(
                        thread.android_version
                      )}
                    </div>
                  `
                  : ""
              }

            </div>
          `
          : ""
      }

    </div>
  `;


  html += renderPost(
    thread.username,
    thread.created_at,
    thread.content,
    thread.user_id === currentUser?.id,
    `deleteThread('${thread.id}')`
  );


  replies.forEach(reply => {

    html += renderPost(
      reply.username,
      reply.created_at,
      reply.content,
      reply.user_id === currentUser?.id,
      `deleteReply('${reply.id}')`
    );
  });


  threadContainer.innerHTML =
    html;

  clearMessage(replyMessage);
  replyInput.value = "";
}


function renderPost(
  username,
  date,
  content,
  canDelete,
  deleteFunction
) {

  return `
    <article class="post">

      <div class="post-header">

        <span class="post-user">
          ${escapeHtml(username)}
        </span>

        <span class="post-date">
          ${formatDate(date)}
        </span>

      </div>

      <div class="post-body">
        ${escapeHtml(content)}
      </div>

      ${
        canDelete
          ? `
            <div class="post-actions">

              <button
                class="button red"
                onclick="${deleteFunction}"
              >
                Delete
              </button>

            </div>
          `
          : ""
      }

    </article>
  `;
}


function showThread() {
  hideAllPages();
  threadPage.classList.remove("hidden");
}


/* =========================================================
   REPLY
   ========================================================= */

document
  .getElementById("replyBtn")
  .addEventListener(
    "click",
    async () => {

      clearMessage(replyMessage);

      if (!currentUser) {
        showMessage(
          replyMessage,
          "You must be logged in."
        );
        return;
      }


      const content =
        replyInput.value.trim();


      if (!content) {
        showMessage(
          replyMessage,
          "Write a reply first."
        );
        return;
      }


      const button =
        document.getElementById(
          "replyBtn"
        );

      button.disabled = true;
      button.textContent =
        "Posting...";


      try {

        const {
          error
        } =
          await supabaseClient
            .from("forum_replies")
            .insert({
              thread_id:
                currentThreadId,

              user_id:
                currentUser.id,

              username:
                currentUsername,

              content
            });


        if (error) {
          throw error;
        }


        await openThread(
          currentThreadId
        );


      } catch (error) {

        console.error(error);

        showMessage(
          replyMessage,
          error.message ||
          "Could not post reply."
        );

      } finally {

        button.disabled = false;
        button.textContent =
          "Post Reply";
      }
    }
  );


/* =========================================================
   DELETE THREAD
   ========================================================= */

async function deleteThread(threadId) {

  if (!currentUser) {
    return;
  }


  if (
    !confirm(
      "Delete this thread and all replies?"
    )
  ) {
    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("forum_threads")
      .delete()
      .eq("id", threadId)
      .eq("user_id", currentUser.id);


  if (error) {
    alert(error.message);
    return;
  }


  currentThreadId = null;

  await loadThreads();
  showForum();
}


/* =========================================================
   DELETE REPLY
   ========================================================= */

async function deleteReply(replyId) {

  if (!currentUser) {
    return;
  }


  if (
    !confirm(
      "Delete this reply?"
    )
  ) {
    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("forum_replies")
      .delete()
      .eq("id", replyId)
      .eq("user_id", currentUser.id);


  if (error) {
    alert(error.message);
    return;
  }


  await openThread(
    currentThreadId
  );
}


/* =========================================================
   BACK
   ========================================================= */

document
  .getElementById("backToForumBtn")
  .addEventListener(
    "click",
    async () => {

      currentThreadId = null;

      await loadThreads();

      showForum();
    }
  );


/* =========================================================
   AUTH STATE
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    if (
      session?.user &&
      !currentUser
    ) {
      await loginUser(
        session.user
      );
    }

    if (!session) {
      setLoggedOut();
    }
  }
);


/* =========================================================
   START
   ========================================================= */

(async function start() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }


    if (data.session?.user) {

      await loginUser(
        data.session.user
      );

    } else {

      setLoggedOut();

    }

  } catch (error) {

    console.error(error);

    showMessage(
      authMessage,
      "Supabase connection failed: " +
      error.message
    );
  }

})();
```
