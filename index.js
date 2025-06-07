  (function () {
    console.log("🔄 Analytics script initiated");

    // Generate or get existing session ID
    function getOrCreateSessionId() {
      console.log("🔐 Checking for existing session ID in sessionStorage...");
      let sessionId = sessionStorage.getItem("session_id");
      
      if (!sessionId) {
        console.log("❌ No session ID found. Generating new session ID...");
        sessionId = crypto.randomUUID(); // Fallback can be added for older browsers
        sessionStorage.setItem("session_id", sessionId);
        console.log("✅ New session ID generated and stored:", sessionId);
      } else {
        console.log("✅ Existing session ID found:", sessionId);
      }

      return sessionId;
    }

    // Get token from localStorage or cookie
    function getUserToken() {
      const localToken = localStorage.getItem("user_token");
      const cookieToken = getCookie("user_token");
      const token = localToken || cookieToken;
      console.log("🔐 Retrieved user token from storage/cookies:", token);
      return token;
    }

    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const cookieValue = parts.pop().split(";").shift();
        console.log(`🍪 Cookie "${name}" found:`, cookieValue);
        return cookieValue;
      }
      console.log(`🍪 Cookie "${name}" not found`);
      return null;
    }

    console.log("📊 Preparing analytics payload...");

    const analyticsData = {
      session_id: getOrCreateSessionId(),
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timestamp: new Date().toISOString(),
      isLoggedIn: !!getUserToken(),
      token: getUserToken(),
    };

    console.log("📦 Analytics Data Ready:", analyticsData);

  })();
