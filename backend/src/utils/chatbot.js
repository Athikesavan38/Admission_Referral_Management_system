'use strict';

// ── Shared responses (both roles) ─────────────────────────────────────────────
const SHARED = [
  { p: ['hello','hi','hey','good morning','good afternoon','good evening','howdy','hola'],
    r: (role) => role === 'admin'
      ? `👋 Hello Admin! I'm your **CIET Admin Assistant**. I can help you with:\n• Managing referrals (approve/reject)\n• Viewing analytics & reports\n• Understanding the credit system\n• Portal administration\n\nType **help** to see all commands.`
      : `👋 Hello! I'm your **CIET Referral Assistant**. I can help you with:\n• Submitting referrals\n• Checking your referral status\n• Understanding credits & leaderboard\n• Portal navigation\n\nType **help** to see all commands.` },

  { p: ['thank','thanks','thank you','great','awesome','perfect','good','excellent','wonderful'],
    r: () => `😊 You're welcome! Is there anything else I can help you with?` },

  { p: ['bye','goodbye','see you','exit','close','quit','later'],
    r: () => `👋 Goodbye! Feel free to come back anytime. Have a great day! 🎓` },

  { p: ['who are you','what are you','your name','introduce yourself'],
    r: (role) => role === 'admin'
      ? `🤖 I'm the **CIET Admin AI Assistant** — your intelligent portal companion.\n\nI can help you manage referrals, understand analytics, and navigate admin features. I'm available 24/7!`
      : `🤖 I'm the **CIET Referral AI Assistant** — your intelligent portal companion.\n\nI help referrers like you submit referrals, track status, earn credits, and climb the leaderboard. I'm available 24/7!` },

  { p: ['aadhaar','aadhar','12 digit','duplicate referral'],
    r: () => `🪪 **Aadhaar Number Rules:**\n• Must be exactly **12 digits**\n• Each student can only be referred **once**\n• If someone already referred the same Aadhaar → "Duplicate Referral" error\n• The **first submission always wins**\n• Aadhaar cannot be changed after submission` },

  { p: ['notification','alert','bell','real time','live update'],
    r: () => `🔔 **Real-Time Notifications:**\nYou receive instant notifications for:\n• 📋 Referral submitted\n• 🎉 Admission approved\n• ❌ Referral rejected (with reason)\n• ⚠️ Duplicate detected\n\nClick the 🔔 bell icon in the top bar to view all. Click any notification to jump to details.` },

  { p: ['credit','points','earn','reward','score'],
    r: () => `⭐ **Credit System:**\n• **First approved referral** → 🏆 20 credits\n• **Each subsequent approval** → ⭐ 10 credits\n\n⚠️ Credits are awarded **only on admin approval**, not on submission.\n\nView your credits on the Leaderboard page or your dashboard header.` },

  { p: ['leaderboard','ranking','top','highest','competition','winner'],
    r: () => `🏆 **Leaderboard:**\nRanks all referrers by credits earned.\n\n**Filters:**\n• ⬆️ Highest Credits\n• ⬇️ Lowest Credits\n• ⭕ No Credits\n\nFilter by year to see the **Top Referrer of the Year** 🥇\nThe top performer gets a special gold banner!` },

  { p: ['dark mode','light mode','theme','color'],
    r: () => `🌙 **Theme Toggle:**\nClick the **sun/moon icon** in the top bar to switch between light and dark mode.\n\nYour preference is saved automatically.` },

  { p: ['ai','analytics','chart','graph','insight'],
    r: () => `📊 **AI Analytics:**\nGo to **AI Analytics** in the sidebar to see:\n• Monthly referral trends\n• Course distribution charts\n• Approval rate insights\n• Personalized AI recommendations\n\nThe AI analyzes your data and gives smart suggestions!` },
];

// ── User-only responses ────────────────────────────────────────────────────────
const USER_RESPONSES = [
  { p: ['how to submit','submit referral','refer a student','how do i refer','add referral','new referral','start'],
    r: () => `📋 **How to Submit a Referral:**\n1. Click **"Submit Referral"** in the sidebar\n2. Fill personal details (Aadhaar, name, phone, email)\n3. Add academic info (institution, 10th & 12th marks, course)\n4. Enter address & location (country → state → city)\n5. Upload profile photo 📸 (optional)\n6. Upload documents 📄 (marksheets, certificates)\n7. Click **"Submit Referral"**\n\n💡 Tip: Complete all fields for faster approval!` },

  { p: ['check status','my referral','status','approved','rejected','pending','result'],
    r: () => `🔍 **Check Your Referral Status:**\n• Go to **"Check Status"** in the sidebar\n• See all your referred students in a table\n• Filter by name, date, department, or status\n• Click any row to expand details\n\n**Status meanings:**\n• ⏳ **Pending** — awaiting admin review\n• ✅ **Approved** — credits awarded to you!\n• ❌ **Rejected** — click to see the admin's remarks` },

  { p: ['document','upload','marksheet','certificate','file','photo','image','drag'],
    r: () => `📄 **Document Upload:**\n• **Profile Photo** — JPG, PNG, WEBP (max 5MB)\n• **Academic Docs** — PDF, JPG, PNG, DOC (max 5MB each, up to 5 files)\n\n**How to upload:**\n• Drag & drop files onto the upload zone\n• Or click to browse your files\n\n💡 Uploading marksheets speeds up admin approval!` },

  { p: ['referral id','my id','ref-','identifier'],
    r: () => `🪪 **Your Referral ID:**\nFormat: **REF-YYYY-XXXXX** (e.g. REF-2024-48291)\n\nFind it in:\n• Your dashboard header\n• The Leaderboard page\n\nShare it to identify yourself as a referrer.` },

  { p: ['why rejected','rejection reason','remarks','what went wrong','improve'],
    r: () => `💡 **Understanding Rejection:**\nWhen your referral is rejected:\n1. Go to **Check Status**\n2. Click the rejected referral row\n3. See the **admin's remarks** explaining why\n\n**Common reasons:**\n• Incomplete documents\n• Invalid Aadhaar\n• Student already enrolled\n• Ineligible course\n\nFix the issue and refer again with a different student!` },

  { p: ['how many referral','total referral','my count','my stats'],
    r: () => `📊 **Your Referral Stats:**\nCheck your dashboard for:\n• Total referrals submitted\n• Approved / Pending / Rejected counts\n• Total credits earned\n• Your rank on the leaderboard\n\nGo to **AI Analytics** for detailed charts and insights!` },

  { p: ['speech','voice','microphone','speak','talk'],
    r: () => `🎤 **Speech-to-Text:**\nOn the Submit Referral form, click the **microphone icon** 🎤 next to the Student Name field.\n\nSpeak clearly and your words will be typed automatically!\n\n⚠️ Works best in Chrome or Edge browsers.` },

  { p: ['help','what can you do','options','menu','features','commands'],
    r: () => `🤖 **User Assistant — Commands:**\n\n📋 **Referrals**\n• "How to submit a referral"\n• "Check my referral status"\n• "Why was my referral rejected"\n\n⭐ **Credits & Rankings**\n• "How do credits work"\n• "Show leaderboard"\n• "My referral stats"\n\n📄 **Documents**\n• "How to upload documents"\n• "What files are accepted"\n\n🔧 **Portal Help**\n• "My referral ID"\n• "Speech to text"\n• "Notifications"\n\nJust type naturally!` },
];

// ── Admin-only responses ───────────────────────────────────────────────────────
const ADMIN_RESPONSES = [
  { p: ['how to approve','approve referral','accept','confirm admission'],
    r: () => `✅ **How to Approve a Referral:**\n1. Go to **Check Status** or **Admin Dashboard**\n2. Click on a referral row to expand it\n3. Click **"✓ Approve"** button\n4. Add optional remarks\n5. Click **"Confirm Approve"**\n\n💡 Approving awards credits to the referrer automatically!` },

  { p: ['how to reject','reject referral','decline','deny'],
    r: () => `❌ **How to Reject a Referral:**\n1. Go to **Check Status** or **Admin Dashboard**\n2. Click on a referral row to expand it\n3. Click **"✕ Reject"** button\n4. **Enter rejection remarks** (required)\n5. Click **"Confirm Reject"**\n\n⚠️ Remarks are mandatory — the referrer will see your reason.` },

  { p: ['pending','how many pending','review queue','backlog'],
    r: () => `⏳ **Managing Pending Referrals:**\n• Go to **Check Status** and filter by **"Pending"**\n• Or use the **Admin Dashboard** tab filters\n• Sort by date to review oldest first\n\n💡 Check **AI Analytics** for a count of pending referrals and smart insights!` },

  { p: ['export','csv','download','report','data'],
    r: () => `📥 **Export Referral Data:**\n1. Go to **Admin Dashboard**\n2. Apply any filters (date, course, status)\n3. Click **"Export CSV"** button\n\nThe CSV includes: student name, Aadhaar, course, referrer, status, marks, location, and timestamp.` },

  { p: ['filter','search','find referral','sort'],
    r: () => `🔍 **Filtering Referrals:**\n**Admin Dashboard filters:**\n• Status (pending/approved/rejected)\n• Course/Department\n• Date range\n• Search by name or email\n\n**Check Status filters:**\n• Student name\n• Submitted date\n• Department\n• Status\n\nFilters can be combined for precise results!` },

  { p: ['credit','who has credit','top referrer','leaderboard admin'],
    r: () => `⭐ **Credit Management:**\nCredits are awarded automatically:\n• **20 credits** — first approved referral\n• **10 credits** — each subsequent approval\n• Credits are **deducted** if you reverse an approval to rejection\n\nView the **Leaderboard** to see all referrer rankings.` },

  { p: ['analytics','report','statistics','data','insight','chart'],
    r: () => `📊 **Admin Analytics:**\nGo to **AI Analytics** to see:\n• Total / Approved / Pending / Rejected counts\n• Approval rate percentage\n• Monthly trend charts\n• Course distribution pie chart\n• **Referrals by role** (faculty, alumni, etc.)\n• AI-generated insights and warnings\n\nAll data updates in real time!` },

  { p: ['notification admin','who submitted','new referral alert'],
    r: () => `🔔 **Admin Notifications:**\nYou receive real-time alerts when:\n• 📋 A new referral is submitted (shows referrer name & role)\n• 🔄 You approve or reject a referral\n\nNotifications are role-specific — you only see admin events.\nClick any notification to jump to the referral details.` },

  { p: ['change status','edit status','reverse','undo'],
    r: () => `✏️ **Changing Referral Status:**\nYou can change status even after a decision:\n1. Go to **Check Status**\n2. Click the referral row\n3. Click **"Change Status"** button\n4. Choose new status and add remarks\n\n⚠️ Reversing approval → rejection will deduct credits from the referrer.` },

  { p: ['help','what can you do','options','menu','features','commands','admin help'],
    r: () => `🛡️ **Admin Assistant — Commands:**\n\n✅ **Referral Management**\n• "How to approve a referral"\n• "How to reject a referral"\n• "How many pending referrals"\n• "Change referral status"\n\n📊 **Reports & Data**\n• "Export CSV report"\n• "View analytics"\n• "Filter referrals"\n\n⭐ **Credits & Leaderboard**\n• "How credits work"\n• "Who has the most credits"\n\n🔔 **Notifications**\n• "Admin notifications"\n\nJust type naturally!` },
];

function getBotReply(message, role = 'user') {
  const lower = message.toLowerCase().trim();
  const isAdmin = role === 'admin';

  // Check role-specific responses first
  const roleResponses = isAdmin ? ADMIN_RESPONSES : USER_RESPONSES;
  for (const { p, r } of roleResponses) {
    if (p.some((pat) => lower.includes(pat))) return r(role);
  }

  // Then shared responses
  for (const { p, r } of SHARED) {
    if (p.some((pat) => lower.includes(pat))) return r(role);
  }

  // Fallback
  return isAdmin
    ? `🤔 I'm not sure about that. Type **"help"** to see all admin commands.\n\nFor technical issues, check the server logs or contact the development team.`
    : `🤔 I'm not sure about that. Type **"help"** to see all available commands.\n\nFor urgent issues, please contact the admin directly.`;
}

module.exports = { getBotReply };
