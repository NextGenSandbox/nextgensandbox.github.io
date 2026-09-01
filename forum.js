```javascript
/* ============================================================
   ANDROID HOST FILE
   FORUM
   SUPABASE #2

   Guest system:
   - Automatic anonymous Supabase user
   - Random generated nickname
   - Session persists in browser storage
   - Optional username/password account
   ============================================================ */


const SUPABASE_URL =
  "https://hzazezszxbgethzkqmmf.supabase.co";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6YXplenN6eGJlZ3RoemtxbW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjA3NjQsImV4cCI6MjEwMzgzNjc2NH0.Vgi0AbiYnzPOD_uVafIMcUbNS-DbnD16BlVYTuHopQA";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* ============================================================
   STATE
   ============================================================ */

let currentUser = null;
let currentUsername = "Anonymous";
let isAnonymous = true;

let categories = [];
let currentThreadId = null;

let authMode = "login";


/* ============================================================
   SHORTCUT
   ============================================================ */

const $ =
  id => document.getElementById(id);


/* ============================================================
   SAFE HTML
   ============================================================ */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* ============================================================
   RANDOM GUEST NAME
   ============================================================ */

function generateGuestName() {

  const adjectives = [

    "Blue",
    "Red",
    "Green",
    "Silent",
    "Swift",
    "Cool",
    "Bright",
    "Dark",
    "Pixel",
    "Turbo",
    "Cyber",
    "Lucky",
    "Nova",
    "Hidden",
    "Rapid"

  ];


  const animals = [

    "Fox",
    "Wolf",
    "Bear",
    "Tiger",
    "Eagle",
    "Panda",
    "Otter",
    "Falcon",
    "Raven",
    "Dragon",
    "Pixel",
    "Byte",
    "Lion",
    "Cobra",
    "Hawk"

  ];


  const adjective =
    adjectives[
      Math.floor(
        Math.random() *
        adjectives.length
      )
    ];


  const animal =
    animals[
      Math.floor(
        Math.random() *
        animals.length
      )
    ];


  const number =
    Math.floor(
      1000 +
      Math.random() * 9000
    );


  return `${adjective}${animal}${number}`;
}


/* ============================================================
   DATE
   ============================================================ */

function formatDate(value) {

  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "Unknown date";

  }


  return date.toLocaleString();

}


/* ============================================================
   MESSAGE
   ============================================================ */

function showMessage(
  element,
  message,
  success = false
) {

  element.textContent =
    message;

  element.className =
    success
      ? "message-success"
      : "message-error";

}


function clearMessage(element) {

  element.textContent = "";
  element.className = "";

}


/* ============================================================
   PAGE NAVIGATION
   ============================================================ */

function showPage(page) {

  $("forumHome")
    .classList
    .add("hidden");

  $("newThreadPage")
    .classList
    .add("hidden");

  $("threadPage")
    .classList
    .add("hidden");

  $("accountPage")
    .classList
    .add("hidden");


  page.classList.remove(
    "hidden"
  );

}


/* ============================================================
   USER UI
   ============================================================ */

function updateUserUI() {

  $("usernameDisplay")
    .textContent =
    currentUsername;


  $("userbar")
    .classList
    .remove("hidden");


  if (isAnonymous) {

    $("accountStatus")
      .textContent =
      `You're using the guest identity "${currentUsername}". Your guest session is stored in this browser. Create a permanent account later if you want a named account.`;


    $("accountButton")
      .textContent =
      "Create Account";

  } else {

    $("accountStatus")
      .textContent =
      `You're signed in as "${currentUsername}".`;

    $("accountButton")
      .textContent =
      "Account";

  }


  $("guestReplyNotice")
    .textContent =
    isAnonymous
      ? `Posting as ${currentUsername}`
      : `Replying as ${currentUsername}`;

}


/* ============================================================
   LOAD CURRENT SESSION
   ============================================================ */

async function initializeAuth() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .getSession();


    if (error) {
      throw error;
    }


    if (
      data.session?.user
    ) {

      currentUser =
        data.session.user;


      isAnonymous =
        currentUser.is_anonymous === true;


      /*
       * Existing anonymous user.
       */
      if (isAnonymous) {

        currentUsername =
          currentUser
            .user_metadata
            ?.display_name ||
          generateGuestName();


        /*
         * Make sure metadata contains the nickname.
         */
        if (
          !currentUser.user_metadata
            ?.display_name
        ) {

          const {
            data: updated,
            error: updateError
          } =
            await supabaseClient
              .auth
              .updateUser({
                data: {
                  display_name:
                    currentUsername
                }
              });


          if (
            !updateError &&
            updated?.user
          ) {

            currentUser =
              updated.user;

          }

        }

      } else {

        currentUsername =
          currentUser
            .user_metadata
            ?.username ||
          "User";

      }


      updateUserUI();


      await loadForum();


      return;
    }


    /*
     * No session.
     *
     * Create one automatically.
     */
    await createGuest();


  } catch (error) {

    console.error(
      "Auth startup error:",
      error
    );


    showMessage(
      $("accountMessage"),
      "Authentication failed: " +
      error.message
    );

  }

}


/* ============================================================
   CREATE GUEST
   ============================================================ */

async function createGuest() {

  const guestName =
    generateGuestName();


  const {
    data,
    error
  } =
    await supabaseClient
      .auth
      .signInAnonymously({

        options: {

          data: {
            display_name:
              guestName
          }

        }

      });


  if (error) {

    console.error(
      "Anonymous sign-in failed:",
      error
    );

    /*
     * Show the account screen if anonymous sign-in
     * has not been enabled in Supabase.
     */
    $("authPage")
      ?.classList
      .remove("hidden");


    showPage(
      $("accountPage")
    );


    showMessage(
      $("accountMessage"),
      "Guest access is not enabled in Supabase. Turn on Authentication → Providers → Anonymous Sign-Ins."
    );


    return;
  }


  currentUser =
    data.user;


  currentUsername =
    guestName;


  isAnonymous = true;


  updateUserUI();


  await loadForum();

}


/* ============================================================
   AUTH STATE LISTENER
   ============================================================
   DO NOT perform awaited Supabase calls here.
   Supabase currently documents a deadlock risk when async
   Supabase calls are made inside onAuthStateChange.
   ============================================================ */

supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    if (!session?.user) {
      return;
    }


    currentUser =
      session.user;


    isAnonymous =
      currentUser.is_anonymous === true;


    if (isAnonymous) {

      currentUsername =
        currentUser.user_metadata
          ?.display_name ||
        currentUsername ||
        "Anonymous";

    } else {

      currentUsername =
        currentUser.user_metadata
          ?.username ||
        currentUsername ||
        "User";

    }


    updateUserUI();

  }
);


/* ============================================================
   ACCOUNT BUTTON
   ============================================================ */

$("accountButton")
  .addEventListener(
    "click",
    () => {

      updateUserUI();

      showPage(
        $("accountPage")
      );

    }
  );


/* ============================================================
   LOGIN TAB
   ============================================================ */

$("loginTab")
  .addEventListener(
    "click",
    () => {

      authMode = "login";

      $("loginTab")
        .classList
        .add("active");

      $("registerTab")
        .classList
        .remove("active");

      $("authBtn")
        .textContent =
        "Sign In";

      clearMessage(
        $("accountMessage")
      );

    }
  );


/* ============================================================
   REGISTER TAB
   ============================================================ */

$("registerTab")
  .addEventListener(
    "click",
    () => {

      authMode = "register";

      $("registerTab")
        .classList
        .add("active");

      $("loginTab")
        .classList
        .remove("active");

      $("authBtn")
        .textContent =
        "Create Account";

      clearMessage(
        $("accountMessage")
      );

    }
  );


/* ============================================================
   USERNAME → INTERNAL EMAIL
   ============================================================ */

function usernameToEmail(
  username
) {

  return (
    username +
    "@forum.androidhostfile.local"
  );

}


/* ============================================================
   USERNAME VALIDATION
   ============================================================ */

function validUsername(
  username
) {

  return /^[a-z0-9_-]{3,24}$/
    .test(username);

}


/* ============================================================
   LOGIN / REGISTER
   ============================================================ */

$("authBtn")
  .addEventListener(
    "click",
    authenticate
  );


$("passwordInput")
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        authenticate();

      }

    }
  );


async function authenticate() {

  const username =
    $("usernameInput")
      .value
      .trim()
      .toLowerCase();


  const password =
    $("passwordInput")
      .value;


  clearMessage(
    $("accountMessage")
  );


  if (
    !validUsername(username)
  ) {

    showMessage(
      $("accountMessage"),
      "Username must be 3–24 characters and contain only letters, numbers, underscores or hyphens."
    );

    return;
  }


  if (
    password.length < 6
  ) {

    showMessage(
      $("accountMessage"),
      "Password must contain at least 6 characters."
    );

    return;
  }


  $("authBtn").disabled = true;


  try {

    const email =
      usernameToEmail(
        username
      );


    /* ======================================================
       REGISTER
       ====================================================== */

    if (
      authMode === "register"
    ) {

      $("authBtn")
        .textContent =
        "Creating Account...";


      /*
       * Remove guest session first.
       *
       * The guest remains a guest only until this point.
       */
      if (
        currentUser &&
        currentUser.is_anonymous
      ) {

        await supabaseClient
          .auth
          .signOut();

        currentUser = null;

      }


      const {
        data,
        error
      } =
        await supabaseClient
          .auth
          .signUp({

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


      if (!data.session) {

        showMessage(
          $("accountMessage"),
          "Account created, but Supabase did not return a session. Make sure Confirm email is OFF."
        );

        return;

      }


      currentUser =
        data.user;

      currentUsername =
        username;

      isAnonymous = false;


      $("usernameInput")
        .value = "";

      $("passwordInput")
        .value = "";


      updateUserUI();


      await loadForum();


      showMessage(
        $("accountMessage"),
        "Account created successfully!",
        true
      );


      setTimeout(
        () => showPage(
          $("forumHome")
        ),
        500
      );


      return;

    }


    /* ======================================================
       LOGIN
       ====================================================== */

    $("authBtn")
      .textContent =
      "Signing In...";


    /*
     * Remove the guest session first.
     */
    if (
      currentUser &&
      currentUser.is_anonymous
    ) {

      await supabaseClient
        .auth
        .signOut();

      currentUser = null;

    }


    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .signInWithPassword({

          email,

          password

        });


    if (error) {
      throw error;
    }


    currentUser =
      data.user;

    currentUsername =
      username;

    isAnonymous = false;


    $("usernameInput")
      .value = "";

    $("passwordInput")
      .value = "";


    updateUserUI();


    await loadForum();


    showPage(
      $("forumHome")
    );


  } catch (error) {

    console.error(
      "Authentication:",
      error
    );


    showMessage(
      $("accountMessage"),
      error.message ||
      "Authentication failed."
    );


  } finally {

    $("authBtn").disabled =
      false;

    $("authBtn")
      .textContent =
      authMode === "login"
        ? "Sign In"
        : "Create Account";

  }

}


/* ============================================================
   NEW GUEST
   ============================================================ */

$("logoutBtn")
  .addEventListener(
    "click",
    async () => {

      try {

        await supabaseClient
          .auth
          .signOut();


        currentUser = null;
        currentUsername =
          "Anonymous";
        isAnonymous = true;


        /*
         * Get a new guest identity.
         */
        await createGuest();


      } catch (error) {

        console.error(error);

        alert(
          "Could not create new guest: " +
          error.message
        );

      }

    }
  );


/* ============================================================
   LOAD FORUM
   ============================================================ */

async function loadForum() {

  await loadCategories();

  await loadThreads();

  updateUserUI();

  showPage(
    $("forumHome")
  );

}


/* ============================================================
   CATEGORIES
   ============================================================ */

async function loadCategories() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("forum_categories")
      .select("*")
      .order(
        "sort_order",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(error);

    $("categoryGrid").innerHTML =
      `<div class="message-error">
        ${escapeHtml(
          error.message
        )}
      </div>`;

    return;

  }


  categories =
    data || [];


  $("categoryGrid").innerHTML =
    categories
      .map(category => `

        <a
          href="#"
          class="category"
          data-category-id="${escapeHtml(category.id)}"
        >

          <div class="category-icon">
            ${escapeHtml(
              category.icon || "📁"
            )}
          </div>

          <h3>
            ${escapeHtml(
              category.name
            )}
          </h3>

          <p>
            ${escapeHtml(
              category.description || ""
            )}
          </p>

        </a>

      `)
      .join("");


  $("categorySelect").innerHTML =
    `<option value="all">
      All Categories
    </option>`;


  $("threadCategory")
    .innerHTML = "";


  categories.forEach(
    category => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        category.id;

      option.textContent =
        category.name;


      $("categorySelect")
        .appendChild(
          option.cloneNode(true)
        );


      $("threadCategory")
        .appendChild(
          option
        );

    }
  );


  document
    .querySelectorAll(
      "[data-category-id]"
    )
    .forEach(
      element => {

        element.addEventListener(
          "click",
          event => {

            event.preventDefault();

            $("categorySelect")
              .value =
              element.dataset
                .categoryId;

            loadThreads();

          }
        );

      }
    );

}


/* ============================================================
   LOAD THREADS
   ============================================================ */

async function loadThreads() {

  $("threadsList").innerHTML =
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
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(100);


  const category =
    $("categorySelect")
      .value;


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
    $("searchInput")
      .value
      .trim()
      .replace(/[%_]/g, "");


  if (search) {

    query =
      query.or(
        `title.ilike.%${search}%,device.ilike.%${search}%,codename.ilike.%${search}%`
      );

  }


  const {
    data,
    error
  } =
    await query;


  if (error) {

    console.error(error);

    $("threadsList").innerHTML =
      `<div class="message-error">
        ${escapeHtml(
          error.message
        )}
      </div>`;

    return;

  }


  if (
    !data ||
    data.length === 0
  ) {

    $("threadsList").innerHTML =
      `<div class="empty">
        No discussions found.
      </div>`;

    return;

  }


  $("threadsList").innerHTML =
    data
      .map(thread => {

        const category =
          thread.forum_categories;


        return `

          <a
            href="#"
            class="thread"
            data-thread-id="${escapeHtml(thread.id)}"
          >

            <div class="thread-title">
              ${escapeHtml(
                thread.title
              )}
            </div>


            <div>

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

              ${escapeHtml(
                thread.username
              )}

              •

              ${formatDate(
                thread.created_at
              )}

              ${
                thread.codename
                  ? `
                    •
                    ${escapeHtml(
                      thread.codename
                    )}
                  `
                  : ""
              }

            </div>

          </a>

        `;

      })
      .join("");


  document
    .querySelectorAll(
      "[data-thread-id]"
    )
    .forEach(
      element => {

        element.addEventListener(
          "click",
          event => {

            event.preventDefault();

            openThread(
              element.dataset
                .threadId
            );

          }
        );

      }
    );

}


/* ============================================================
   SEARCH
   ============================================================ */

let searchTimer = null;


$("searchInput")
  .addEventListener(
    "input",
    () => {

      clearTimeout(
        searchTimer
      );


      searchTimer =
        setTimeout(
          loadThreads,
          250
        );

    }
  );


$("categorySelect")
  .addEventListener(
    "change",
    loadThreads
  );


/* ============================================================
   NEW THREAD
   ============================================================ */

$("newThreadBtn")
  .addEventListener(
    "click",
    () => {

      clearMessage(
        $("threadMessage")
      );

      showPage(
        $("newThreadPage")
      );

    }
  );


$("backNewThreadBtn")
  .addEventListener(
    "click",
    () => {

      showPage(
        $("forumHome")
      );

    }
  );


/* ============================================================
   CREATE THREAD
   ============================================================ */

$("publishThreadBtn")
  .addEventListener(
    "click",
    async () => {

      const message =
        $("threadMessage");


      clearMessage(message);


      if (!currentUser) {

        showMessage(
          message,
          "You don't have a forum identity yet."
        );

        return;

      }


      const title =
        $("threadTitle")
          .value
          .trim();


      const categoryId =
        $("threadCategory")
          .value;


      const type =
        $("threadType")
          .value;


      const device =
        $("threadDevice")
          .value
          .trim();


      const codename =
        $("threadCodename")
          .value
          .trim();


      const android =
        $("threadAndroid")
          .value
          .trim();


      const content =
        $("threadContent")
          .value
          .trim();


      if (
        title.length < 3
      ) {

        showMessage(
          message,
          "Enter a thread title."
        );

        return;

      }


      if (!categoryId) {

        showMessage(
          message,
          "Choose a category."
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


      const button =
        $("publishThreadBtn");


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
                android || null,

              content

            });


        if (error) {
          throw error;
        }


        $("threadTitle").value = "";
        $("threadDevice").value = "";
        $("threadCodename").value = "";
        $("threadAndroid").value = "";
        $("threadContent").value = "";


        await loadThreads();


        showPage(
          $("forumHome")
        );


      } catch (error) {

        console.error(error);

        showMessage(
          message,
          "Could not publish: " +
          error.message
        );

      } finally {

        button.disabled = false;

        button.textContent =
          "Publish Thread";

      }

    }
  );


/* ============================================================
   OPEN THREAD
   ============================================================ */

async function openThread(
  threadId
) {

  currentThreadId =
    threadId;


  showPage(
    $("threadPage")
  );


  $("threadContainer").innerHTML =
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
      .eq(
        "id",
        threadId
      )
      .single();


  if (threadError) {

    $("threadContainer").innerHTML =
      `<div class="message-error">
        ${escapeHtml(
          threadError.message
        )}
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
      .eq(
        "thread_id",
        threadId
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (repliesError) {

    $("threadContainer").innerHTML =
      `<div class="message-error">
        ${escapeHtml(
          repliesError.message
        )}
      </div>`;

    return;

  }


  renderThread(
    thread,
    replies || []
  );

}


/* ============================================================
   RENDER THREAD
   ============================================================ */

function renderThread(
  thread,
  replies
) {

  let html = `

    <div class="box">

      <h2>
        ${escapeHtml(
          thread.title
        )}
      </h2>


      <div style="margin-top:10px">

        <span class="badge">

          ${escapeHtml(
            thread.forum_categories
              ?.icon || "📁"
          )}

          ${escapeHtml(
            thread.forum_categories
              ?.name || "General"
          )}

        </span>


        <span class="badge">

          ${escapeHtml(
            thread.thread_type
          )}

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
                      <strong>
                        Device:
                      </strong>

                      ${escapeHtml(
                        thread.device
                      )}
                    </div>
                  `
                  : ""
              }


              ${
                thread.codename
                  ? `
                    <div>
                      <strong>
                        Codename:
                      </strong>

                      ${escapeHtml(
                        thread.codename
                      )}
                    </div>
                  `
                  : ""
              }


              ${
                thread.android_version
                  ? `
                    <div>
                      <strong>
                        Android:
                      </strong>

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


  html += `
    <article class="post">

      <div class="post-header">

        <span class="post-user">
          ${escapeHtml(
            thread.username
          )}
        </span>

        <span class="post-date">
          ${formatDate(
            thread.created_at
          )}
        </span>

      </div>


      <div class="post-body">
        ${escapeHtml(
          thread.content
        )}
      </div>

    </article>
  `;


  replies.forEach(
    reply => {

      html += `

        <article class="post">

          <div class="post-header">

            <span class="post-user">
              ${escapeHtml(
                reply.username
              )}
            </span>

            <span class="post-date">
              ${formatDate(
                reply.created_at
              )}
            </span>

          </div>


          <div class="post-body">
            ${escapeHtml(
              reply.content
            )}
          </div>

        </article>

      `;

    }
  );


  $("threadContainer").innerHTML =
    html;


  $("replyInput").value = "";

  $("guestReplyNotice")
    .textContent =
    `Posting as ${currentUsername}`;

}


/* ============================================================
   REPLY
   ============================================================ */

$("replyBtn")
  .addEventListener(
    "click",
    async () => {

      clearMessage(
        $("replyMessage")
      );


      if (!currentUser) {

        showMessage(
          $("replyMessage"),
          "No forum session exists."
        );

        return;

      }


      const content =
        $("replyInput")
          .value
          .trim();


      if (!content) {

        showMessage(
          $("replyMessage"),
          "Write a reply first."
        );

        return;

      }


      const button =
        $("replyBtn");


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
          $("replyMessage"),
          "Could not post reply: " +
          error.message
        );

      } finally {

        button.disabled =
          false;

        button.textContent =
          "Post Reply";

      }

    }
  );


/* ============================================================
   BACK
   ============================================================ */

$("backForumBtn")
  .addEventListener(
    "click",
    async () => {

      currentThreadId =
        null;

      await loadThreads();

      showPage(
        $("forumHome")
      );

    }
  );


$("backAccountBtn")
  .addEventListener(
    "click",
    () => {

      showPage(
        $("forumHome")
      );

    }
  );


/* ============================================================
   START
   ============================================================ */

initializeAuth();
```
